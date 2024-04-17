const BASE_URL = 'https://linkfeed.net';

document.addEventListener('DOMContentLoaded', async function () {
  console.log("DOMContentLoaded event fired"); // Log when the DOM is fully loaded

  let token = await new Promise(resolve => {
      console.log("Attempting to retrieve token from storage"); // Log before retrieving token
      browser.storage.local.get('token').then(result => {
          console.log("Token retrieved from storage:", result.token); // Log the retrieved token
          resolve(result.token);
      });
  });

  if (token) {
      console.log("Token exists, attempting to fetch user data"); // Log when token exists
      try {
          const response = await fetch(`${BASE_URL}/api/user?token=${token}`, {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json'
              }
          });

          console.log("Fetch response received:", response); // Log the fetch response

          if (response.ok) {
              const user = await response.json();
              console.log("User data received:", user); // Log the received user data
              const userprofile = document.getElementById("userprofile");
              if (userprofile) {
                  userprofile.href = `${BASE_URL}/u/${user.userhash}`;
                  console.log("User profile link set:", userprofile.href); // Log the set user profile link
              } else {
                  console.error("User profile element not found"); // Log if user profile element is not found
              }
          } else {
              console.error('Failed to fetch user object:', response.statusText);
          }
      } catch (error) {
          console.error('An error occurred while fetching the user object:', error);
      }
  } else {
      console.log("Token does not exist"); // Log if token does not exist
  }

  browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      const tab = tabs[0];
      const url = tab.url;
      console.log("Current tab URL:", url); // Log the current tab URL

      const urlInput = document.getElementById('urlInput');
      if (urlInput) {
          urlInput.value = url;
          console.log("URL input value set:", urlInput.value); // Log the set URL input value
      } else {
          console.error("URL input element not found"); // Log if URL input element is not found
      }
  });
});


document.getElementById('submitBtn').addEventListener('click', async () => {
 try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    const titleInput = document.getElementById('titleInput');
    const title = titleInput.value;

    let token = await new Promise(resolve => browser.storage.local.get('token').then(result => resolve(result.token)));
    if (!token) {
      token = await generateToken();
      await browser.storage.local.set({ token });
    }

    const response = await fetch(`${BASE_URL}/api/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        linkurl: url,
        linktitle: title,
        token: token
      })
    });

    if (response.ok) {
      displayMessage('Link submitted successfully!', 'success');
    } else {
      if (response.status === 409) {
        displayMessage('You had that link already!', 'error');
      } else {
        const responseBody = await response.json();
        displayMessage('Failed to submit link.', 'error');
      }
    }

 } catch (error) {
    console.error('An error occurred:', error);
    displayError('API Offline');
 }
});



function displayMessage(message, type) {
  const messageElement = document.getElementById('errorMessage');
  messageElement.textContent = message;
  messageElement.classList.remove('error-message', 'fade-out');

  if (type === 'success') {
    messageElement.classList.add('success-message');
  } else if (type === 'error') {
    messageElement.classList.add('error-message');
  }

  messageElement.addEventListener('transitionend', function () {
    messageElement.textContent = '';
    messageElement.classList.remove('success-message', 'error-message', 'fade-out');
  });
}


async function generateToken() {
  const salt = "we do a little codin";
  const currentTime = new Date().getTime().toString();
  const message = currentTime + salt;
  const msgBuffer = new TextEncoder('utf-8').encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');

  return hashHex;
}

function displayError(message) {
  const errorElement = document.getElementById('errorMessage');
  errorElement.textContent = message;
  errorElement.classList.add('error-message');
  errorElement.classList.add('fade-out');
  errorElement.addEventListener('transitionend', function () {
    errorElement.textContent = '';
    errorElement.classList.remove('error-message', 'fade-out');
  });
}
