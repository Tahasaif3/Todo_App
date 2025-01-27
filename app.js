import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, GithubAuthProvider, TwitterAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase, ref, set, push, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCXKwTmQHRdopHmdPV56Uypxt3yy-vm4Ls",
  authDomain: "auth-js-c349b.firebaseapp.com",
  databaseURL:"https://auth-js-c349b-default-rtdb.firebaseio.com",
  projectId: "auth-js-c349b",
  storageBucket: "auth-js-c349b.appspot.com",
  messagingSenderId: "8525102033",
  appId: "1:8525102033:web:19c8b591e44c8213ee7ef0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

const CLOUDNAME = "dibtbtmj3";
const UNSIGNEDUPLOAD = "mytodoserver";
const url = `https://api.cloudinary.com/v1_1/${CLOUDNAME}/upload`;

const redirectWithDelay = (url, delay = 1500) => {
  setTimeout(() => window.location.href = url, delay);
};

function showPopup(message, type = 'success') {
  const popup = document.createElement('div');
  popup.className = `popup ${type}`;
  popup.textContent = message;
  document.body.appendChild(popup);
  setTimeout(() => {
    popup.classList.add('show');
  }, 10);
  setTimeout(() => {
    popup.classList.remove('show');
    setTimeout(() => {
      popup.remove();
    }, 300);
  }, 3000);
}

function showLoading() {
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(loadingOverlay);
}

function hideLoading() {
  const loadingOverlay = document.querySelector('.loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.remove();
  }
}

async function updateUserData(user, additionalData = {}) {
  const userData = {
    name: user.displayName || additionalData.name || 'User',
    email: user.email,
    photoURL: user.photoURL || additionalData.photoURL,
    ...additionalData
  };
  await set(ref(database, 'users/' + user.uid), userData);
  return userData;
}

function showDialog(title, message, inputValue = '', showInput = false) {
  const dialog = document.getElementById('dialog-overlay');
  const dialogTitle = document.getElementById('dialog-title');
  const dialogMessage = document.getElementById('dialog-message');
  const dialogInput = document.getElementById('dialog-input');

  dialogTitle.textContent = title;
  dialogMessage.textContent = message;
  dialogInput.value = inputValue;
  dialogInput.style.display = showInput ? 'block' : 'none';

  dialog.style.display = 'block';

  return new Promise((resolve) => {
      const confirmBtn = document.getElementById('dialog-confirm');
      const cancelBtn = document.getElementById('dialog-cancel');

      const closeDialog = (result) => {
          dialog.style.display = 'none';
          resolve(result);
      };

      confirmBtn.onclick = () => closeDialog(showInput ? dialogInput.value : true);
      cancelBtn.onclick = () => closeDialog(false);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');
  const googleSignInBtn = document.getElementById('google-signin');
  const githubSignInBtn = document.getElementById('github-signin');
  const twitterSignInBtn = document.getElementById('twitter-signin');
  const todoForm = document.getElementById('todo-form');
  const signoutBtn = document.getElementById('signout-btn');

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      showLoading();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const imageUpload = document.getElementById("imageUpload");

      try {
        let imageUrl = '';
        if (imageUpload.files.length > 0) {
          const file = imageUpload.files[0];
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', UNSIGNEDUPLOAD);

          const response = await fetch(url, {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error('Image upload failed');
          }

          const data = await response.json();
          imageUrl = data.secure_url;
          console.log("Cloudinary image URL:", imageUrl);
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { 
          displayName: name,
          photoURL: imageUrl || null
        });

        await updateUserData(user, { name, photoURL: imageUrl });
        
        console.log("User signed up:", user);
        showPopup("Signup successful! Redirecting to Login Page.");
        redirectWithDelay("project-selection.html");

      } catch (error) {
        console.error("Signup error:", error);
        showPopup("Signup error: " + error.message, "error");
      } finally {
        hideLoading();
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      showLoading();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const userSnapshot = await get(ref(database, 'users/' + user.uid));
        const userData = userSnapshot.val();
        
        if (!userData) {
          await updateUserData(user);
        }
        
        console.log("User logged in:", user);
        showPopup("Login successful! Redirecting to project selection.");
        redirectWithDelay("project-selection.html");

      } catch (error) {
        console.error("Login error:", error.message);
        showPopup("Login error: " + error.message, "error");
      } finally {
        hideLoading();
      }
    });
  }

  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      showLoading();
      const provider = new GoogleAuthProvider();
      try {
        console.log("Attempting Google Sign-In...");
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        await updateUserData(user);

        console.log("User signed in with Google:", user);
        showPopup("Google Sign-In successful! Redirecting to project selection.");
        redirectWithDelay("project-selection.html");
      } catch (error) {
        console.error("Google Sign-In error:", error);
        if (error.code === 'auth/popup-blocked') {
          showPopup("Google Sign-In popup was blocked. Please allow popups for this site.", "error");
        } else if (error.code === 'auth/popup-closed-by-user') {
          showPopup("Google Sign-In was cancelled. Please try again.", "error");
        } else {
          showPopup("Google Sign-In error: " + error.message, "error");
        }
      } finally {
        hideLoading();
      }
    });
  }

  if (githubSignInBtn) {
    githubSignInBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      showLoading();
      const provider = new GithubAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        await updateUserData(user);

        console.log("User signed in with GitHub:", user);
        showPopup("GitHub Sign-In successful! Redirecting to project selection.");
        redirectWithDelay("project-selection.html");
      } catch (error) {
        console.error("GitHub Sign-In error:", error);
        showPopup("GitHub Sign-In error: " + error.message, "error");
      } finally {
        hideLoading();
      }
    });
  }

  if (twitterSignInBtn) {
    twitterSignInBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      showLoading();
      const provider = new TwitterAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        await updateUserData(user);

        console.log("User signed in with Twitter:", user);
        showPopup("Twitter Sign-In successful! Redirecting to project selection.");
        redirectWithDelay("project-selection.html");
      } catch (error) {
        console.error("Twitter Sign-In error:", error);
        showPopup("Twitter Sign-In error: " + error.message, "error");
      } finally {
        hideLoading();
      }
    });
  }

  if (window.location.pathname.includes('todo.html') || window.location.pathname.includes('project-selection.html')) {
    const userNameElement = document.getElementById('user-name');
    const userEmailElement = document.getElementById('user-email');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');

    let userId = null;

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        userId = user.uid;
        const userRef = ref(database, `users/${userId}`);
        onValue(userRef, (snapshot) => {
          const userData = snapshot.val();
          if (userData) {
            userNameElement.textContent = userData.name || user.displayName || 'User';
            if (userEmailElement) {
              userEmailElement.textContent = userData.email || user.email;
            }
            const userInfoDiv = document.getElementById('user-info');
            if (userInfoDiv) {
              // Remove existing image if any
              const existingImg = userInfoDiv.querySelector('img');
              if (existingImg) existingImg.remove();

              // Create and add new image element
              const userImageElement = document.createElement('img');
              userImageElement.id = 'user-avatar';
              userImageElement.alt = "User profile picture";
              userImageElement.style.width = "60px";
              userImageElement.style.height = "60px";
              userImageElement.style.borderRadius = "60%";
              userImageElement.style.marginRight = "10px";
              
              if (userData.photoURL) {
                userImageElement.src = userData.photoURL;
              } else {
                const canvas = document.createElement('canvas');
                canvas.width = 60;
                canvas.height = 60;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'white';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText((userData.name || user.displayName || 'U')[0].toUpperCase(), 25, 25);
                userImageElement.src = canvas.toDataURL();
              }
              
              userInfoDiv.insertBefore(userImageElement, userInfoDiv.firstChild);
            }
          }
        });

        if (window.location.pathname.includes('todo.html')) {
          const todosRef = ref(database, `users/${userId}/todos`);
          onValue(todosRef, (snapshot) => {
            todoList.innerHTML = '';
            const todos = snapshot.val();
            if (todos) {
              Object.entries(todos).forEach(([key, value]) => {
                addTodoToDOM(key, value);
              });
            }
          });
        }
      } else {
        redirectWithDelay("login.html");
      }
    });

    if (todoForm) {
      todoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (todoInput.value.trim() === '') return;

        const todosRef = ref(database, `users/${userId}/todos`);
        const newTodoRef = push(todosRef);
        await set(newTodoRef, {
          text: todoInput.value,
          completed: false,
          createdAt: new Date().toISOString()
        });

        todoInput.value = '';
        showPopup("Todo added successfully!");
      });
    }

    function addTodoToDOM(id, todoData) {
      const todoItem = document.createElement('li');
      todoItem.className = `todo-item ${todoData.completed ? 'completed' : ''}`;
      todoItem.innerHTML = `
        <span><i class="fas fa-tasks"></i> ${todoData.text}</span>
        <small><i class="far fa-clock"></i> ${new Date(todoData.createdAt).toLocaleString()}</small>
        <div>
          <button class="edit-btn"><i class="fas fa-edit"></i></button>
          <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
        </div>
      `;
      
      todoItem.querySelector('.edit-btn').addEventListener('click', async () => {
        const newText = await showDialog('Edit Todo', 'Enter the new text for your todo:', todoData.text, true);
        if (newText && newText.trim() !== '') {
          await update(ref(database, `users/${userId}/todos/${id}`), { text: newText });
          showPopup("Todo updated successfully!");
        }
      });
  
      todoItem.querySelector('.delete-btn').addEventListener('click', async () => {
        const confirmed = await showDialog('Delete Todo', 'Are you sure you want to delete this todo?');
        if (confirmed) {
          await remove(ref(database, `users/${userId}/todos/${id}`));
          showPopup("Todo deleted successfully!");
        }
      });

      todoList.appendChild(todoItem);
    }
  }

  if (signoutBtn) {
    signoutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        showPopup("Signed out successfully! Redirecting to login page.");
        redirectWithDelay("login.html");
      } catch (error) {
        console.error("Sign out error:", error.message);
        showPopup("Sign out error: " + error.message, "error");
      }
    });
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is signed in:", user);
  } else {
    console.log("User is signed out");
  }
});