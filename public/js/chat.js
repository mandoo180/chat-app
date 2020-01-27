const socket = io();

const $board = document.querySelector('#board');
const $messageInput = document.querySelector('#message-input');
const $chatForm = document.querySelector('#chat-form');
const $messageFormSubmitBtn = document.querySelector('#message-form-submit-btn');
const $sendLocationBtn = document.querySelector('#send-location-btn');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// queryString
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });
const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
  console.log($newMessage.offsetHeight);
  // visible height
  const visibleHeight = $messages.offsetHeight;

  // height of messages container
  const containerHeight = $messages.scrollHeight;
  console.log('containerHeight', containerHeight);

  // how far have i scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;
  console.log('scrollTop', $messages.scrollTop);
  console.log('visibleHeight', $messages.offsetHeight);

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

// I use text under name of "message" object destructuring
socket.on('messageUpdated', ({ username, text: message, createdAt }) => {
  createdAt = moment(createdAt).format('MMM Do HH:mm:ss');
  const html = Mustache.render(messageTemplate, { username, message, createdAt });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('locationMessage', ({ username, text: url, createdAt }) => {
  createdAt = moment(createdAt).format('MMM Do HH:mm:ss');
  const html = Mustache.render(locationMessageTemplate, { username, url, createdAt });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, { room, users });
  $sidebar.innerHTML = html;
  autoscroll();
});

$chatForm.addEventListener('submit', e => {
  e.preventDefault();

  $messageFormSubmitBtn.setAttribute('disabled', 'disabled');

  let message = e.target.elements.message.value;
  socket.emit('sendMessage', message, ({ error, success }) => {
    $messageFormSubmitBtn.removeAttribute('disabled');
    $messageInput.value = '';
    $messageInput.focus();

    if (error) {
      return console.log(error);
    }

    console.log('The message has been sent succesfully.');
    console.log(success);
  });
});

$sendLocationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not availalbe in your browswer.');
  }

  $sendLocationBtn.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition(({ coords }) => {
    socket.emit(
      'sendLocation',
      {
        latitude: coords.latitude,
        longitude: coords.longitude
      },
      ({ error, success }) => {
        $sendLocationBtn.removeAttribute('disabled');
        if (error) {
          return console.log(error);
        }
        console.log(success);
      }
    );
  });
});

socket.emit('join', { username, room }, ({ error, user }) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
