/*jshint esversion: 6*/

import DWUtils from './DWUtils';

export default class LocalReader {

	constructor() {
		this.reconnectReader = false;
		this.mLocalReaderWSSocket = null;
		this.mWSReaders = null;
		this.mCallback = null;
		this.binPath = '';
	}

	get LocalReaderWSSocket() {
		return this.mLocalReaderWSSocket;
	}

	waitForSocketConnection() {
		setTimeout(() => {
			if (this.mLocalReaderWSSocket.readyState === 1) {
				DWUtils.log('Local reader sucessfully connected');
				this.mCallback();
			} else {
				if (this.mLocalReaderWSSocket.readyState === 0) {
					DWUtils.log('wait for connection...');
					this.waitForSocketConnection();
				}
			}
		}, 1000); // wait 1000 milisecond for the connection...
	}

	detectReaderSoftwareRunning() {
		if (!this.firstConnectionMade) {
			var dlUrl = '';
			if (navigator.appVersion.indexOf('Win') !== -1) {
				dlUrl = 'DataWriterWebClient.exe';
			}
			if (navigator.appVersion.indexOf('Mac') !== -1) {
				dlUrl = '';
			}
			if (navigator.appVersion.indexOf('X11') !== -1) {
				dlUrl = '';
			}
			if (navigator.appVersion.indexOf('Linux') !== -1) {
				dlUrl = 'DataWriterWebClient';
			}

			if (dlUrl.length === 0) {
				DWUtils.addMessage(DWUtils.DWTypeMsg.ERROR, 'Sorry, your OS is currently not supported.');
			} else {
				dlUrl = this.binPath + dlUrl;
				DWUtils.addMessage(DWUtils.DWTypeMsg.ERROR, 'Please download and run the DataWriterWebClient to enabled Web Encoding.');
			}
			$('#downloadReaderSoftId').attr('src', dlUrl);

			this.firstConnectionMade = true;
		}
	}

	reset() {
		if (this.mLocalReaderWSSocket !== null) {
			this.mLocalReaderWSSocket.onclose = null;
			this.mLocalReaderWSSocket.close();
		}

		this.mLocalReaderWSSocket = null;
	}
	
	get WebSocketReaders() {
		return this.mWSReaders;
	}

	set WebSocketReaders(eWebSocketReaders) {
		this.mWSReaders = eWebSocketReaders;
	}

	initSocket() {
		DWUtils.log('Connecting to local reader...');
		if (!this.reconnectReader) {
			DWUtils.addMessage(DWUtils.DWTypeMsg.INFO, 'Connecting to local reader...');
		}
		this.mLocalReaderWSSocket = new WebSocket('ws://127.0.0.1:8092');

		this.mLocalReaderWSSocket.onopen = () => {
			this.reconnectReader = false;
			this.firstConnectionMade = true;
			DWUtils.addMessage(DWUtils.DWTypeMsg.SUCCESS, 'Connection to local reader succeeded !');
		};
		this.mLocalReaderWSSocket.onmessage = (event) => {
			//For now directly forward to reader server
			var obj = JSON.parse(event.data);
			DWUtils.sendJson(this.mWSReaders, obj);
		};
		this.mLocalReaderWSSocket.onclose = (event) => {
			DWUtils.log('Local reader disconnected. Reconnecting...');
			if (!this.reconnectReader) {
				DWUtils.addMessage(DWUtils.DWTypeMsg.ERROR, 'Local reader disconnected. Reconnecting...');
			}
			this.reconnectReader = true;
			setTimeout(() => {
				this.initSocket();
			}, 1000);
		};

		this.waitForSocketConnection();
	}

	start(callback) {
		this.firstConnectionMade = false;
		this.mCallback = callback;

		setTimeout(() => {
			this.detectReaderSoftwareRunning();
		}, 2000);

		this.initSocket();
	}
	
	static isSupported() {
		// DataWriterWebClient binary is currently fully tested on Windows only
		return (navigator.appVersion.indexOf('Win') !== -1);
	}
}