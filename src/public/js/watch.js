const startBtn = document.getElementById('start-share');
const stopBtn = document.getElementById('stop-share');
const videoGrid = document.getElementById('watch-video-grid');
const video = document.createElement('video');
video.muted = true;

let myId;

const socket = io();

var peer = new Peer();

peer.on('open', function (id) {
	console.log('[Watch] PeerJS connection opened. Watcher ID: ' + id);
	myId = id;
	// Let the server (and potentially the sharer) know this watcher joined
	socket.emit('join', { roomId: 'ScreenShare', user: id });
	console.log('[Watch] Emitted join event for ID: ' + id);
});

peer.on('call', function (call) {
	console.log('[Watch] Incoming call received from peer: ' + call.peer);

	// Answer the call
	call.answer(); // Answer with no stream of our own
	console.log('[Watch] Answered incoming call.');

	call.on('stream', function (remoteStream) {
		console.log('[Watch] Stream received from call.');
		video.srcObject = remoteStream;

		video.style.width = '100%';
		video.style.height = '100%';
		video.controls = true;

		video.addEventListener('loadedmetadata', () => {
			console.log('[Watch] Video metadata loaded.');
			video.play().then(() => {
				console.log('[Watch] Video playback started.');
			}).catch(e => {
				console.error('[Watch] Video playback failed:', e);
			});
		});

		video.addEventListener('error', (e) => {
			console.error('[Watch] Video element error:', e);
		});

		videoGrid.append(video);
		console.log('[Watch] Appended video element to grid.');

		remoteStream.getVideoTracks()[0].onended = function () {
			console.log('[Watch] Remote video track ended.');
			stopScreen(remoteStream);
		};
	});

	call.on('error', function (err) {
		console.error('[Watch] PeerJS call error:', err);
	});

	call.on('close', function () {
		console.log('[Watch] PeerJS call closed.');
		// Optionally handle UI changes when the call closes
	});
});

peer.on('error', function (err) {
	console.error('[Watch] PeerJS connection error:', err);
});

peer.on('disconnected', function () {
	console.log('[Watch] PeerJS disconnected from signaling server.');
	// Attempt to reconnect? PeerJS might do this automatically depending on the error.
	// peer.reconnect(); // Be cautious with auto-reconnect logic
});

peer.on('close', function () {
	console.log('[Watch] PeerJS connection closed.');
});

function stopScreen(stream) {
	video.srcObject = null;
	videoGrid.innerHTML = null;
	stream.getTracks().forEach((track) => track.stop());

	startBtn.disabled = false;
	stopBtn.disabled = true;
}
