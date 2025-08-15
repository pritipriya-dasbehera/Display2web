const modal = document.getElementById('myModal');
const btn = document.getElementById('share-btn');
const span = document.getElementsByClassName('close')[0];
const startBtn = document.getElementById('start-share');
const stopBtn = document.getElementById('stop-share');
const videoGrid = document.getElementById('video-grid');
const clientStatus = document.getElementById('client-status');
const video = document.createElement('video');
video.muted = true;

let clientId = null;
let myId;

const socket = io();

// Modern PeerJS initialization with TURN/STUN servers
const peer = new Peer({
	config: {
		iceServers: [
			{ urls: 'stun:stun.l.google.com:19302' },
			{
				urls: 'turn:relay1.expressturn.com:3478',
				username: 'expressturn',
				credential: 'expressturn',
			},
		],
	},
});

socket.on('user-connected', (newUser) => {
	if (clientId === null) {
		clientId = newUser;
		clientStatus.style.backgroundColor = '#61C454';
		clientStatus.innerHTML = 'Client connected Successfully';
	}
});

peer.on('open', function (id) {
	console.log('Sharer PeerJS ID: ' + id); // Use console.log for client-side
	myId = id;
	// Let the server know this sharer joined
	socket.emit('join', { roomId: 'ScreenShare', user: id });
});

// When the user clicks the button, open the modal
btn.onclick = function () {
	modal.style.display = 'block';
};

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
	modal.style.display = 'none';
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
	if (event.target == modal) {
		modal.style.display = 'none';
	}
};

function stopScreen(stream) {
	video.srcObject = null;
	videoGrid.innerHTML = null;
	stream.getTracks().forEach((track) => track.stop());

	startBtn.disabled = false;
	stopBtn.disabled = true;
}

function shareScreen() {
	console.log('shareScreen function called'); // Log function entry

	if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
		console.error(
			'Error: navigator.mediaDevices.getDisplayMedia is not available. This might be because the page is not served over HTTPS or accessed via localhost.'
		);
		alert('Screen sharing is not available. Please access this page via localhost or ensure it is served over HTTPS.');
		// Disable the button as screen sharing is not possible
		startBtn.disabled = true;
		return; // Stop the function
	}

	navigator.mediaDevices
		.getDisplayMedia({ cursor: true })
		.then((stream) => {
			console.log('getDisplayMedia successful, got stream'); // Log stream acquisition
			video.srcObject = stream;

			startBtn.disabled = true;
			stopBtn.disabled = false;

			video.style.width = '50%';
			video.style.height = '50%';
			video.style.marginLeft = 'auto';
			video.style.marginRight = 'auto';

			video.addEventListener('loadedmetadata', () => {
				video.play();
			});

			videoGrid.append(video);

			stopBtn.onclick = () => {
				stopScreen(stream);
			};

			stream.getVideoTracks()[0].onended = function () {
				stopScreen(stream);
			};

			socket.on('user-disconnected', (disconnectedUser) => {
				console.log('Watcher PeerJS ID disconnected: ' + disconnectedUser); // Use console.log
				if (disconnectedUser === clientId) {
					clientId = null; // Reset clientId when watcher disconnects
					clientStatus.style.backgroundColor = '#EE695E';
					clientStatus.innerHTML = 'Client disconnected';
					stopScreen(stream); // Stop sharing if the watcher disconnects
				}
			});

			// Ensure clientId is set (watcher has connected) before calling
			console.log(`Checking clientId before calling: ${clientId}`); // Log clientId value
			if (clientId) {
				console.log(`Calling watcher with ID: ${clientId}`);
				var call = peer.call(clientId, stream);
				// Optional: Handle call errors or close events if needed
				call.on('error', (err) => {
					console.error('Peer call error:', err);
				});
				call.on('close', () => {
					console.log('Peer call closed');
				});
			} else {
				console.error('Cannot start share: clientId is null or undefined.');
				// Optionally provide feedback to the user
				stopScreen(stream); // Stop the local stream if we can't call
			}

			// call.on('stream', function (stream) { // This part is usually handled by the receiver ('call' event in watch.js)
			// 	video.srcObject = stream;

			// 	video.style.width = '50%';
			// 	video.style.height = '50%';
			// 	video.style.marginLeft = 'auto';
			// 	video.style.marginRight = 'auto';

			// 	video.addEventListener('loadedmetadata', () => {
			// 		video.play();
			// 	});

			// 	videoGrid.append(video);
			// });
		})
		.catch((err) => {
			console.error('Error getting display media:', err); // Log errors from getDisplayMedia
			// Ensure buttons are reset if permission is denied or another error occurs
			startBtn.disabled = false;
			stopBtn.disabled = true;
		});
}
