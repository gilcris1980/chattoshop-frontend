document.addEventListener('DOMContentLoaded', () => {

    console.log('Login JS loaded');

    // =========================
    // CHECK EXISTING LOGIN
    // =========================

    const existingToken = localStorage.getItem('token');
    const existingUser = localStorage.getItem('user');

    if (existingToken && existingUser) {

        try {

            const user = JSON.parse(existingUser);

            console.log('Existing session found:', user);

            if (
                user.role === 'system_admin' ||
                user.role === 'admin'
            ) {

                window.location.href = './admin-dashboard.html';
                return;

            } else if (user.role === 'seller') {

                window.location.href = './seller-dashboard.html';
                return;

            } else {

                window.location.href = './index.html';
                return;

            }

        } catch (error) {

            console.error('Invalid stored user data');

            localStorage.removeItem('token');
            localStorage.removeItem('user');

        }

    }

    // =========================
    // FORM
    // =========================

    const form = document.getElementById('login-form');

    if (!form) {

        console.error('Login form not found');
        return;

    }

    // =========================
    // PASSWORD TOGGLE
    // =========================

    const togglePasswordBtn =
        document.getElementById('toggle-password');

    const passwordInput =
        document.getElementById('password');

    const eyeIcon =
        document.getElementById('eye-icon');

    if (togglePasswordBtn) {

        togglePasswordBtn.addEventListener('click', () => {

            if (passwordInput.type === 'password') {

                passwordInput.type = 'text';

                eyeIcon.classList.remove('fa-eye');
                eyeIcon.classList.add('fa-eye-slash');

            } else {

                passwordInput.type = 'password';

                eyeIcon.classList.remove('fa-eye-slash');
                eyeIcon.classList.add('fa-eye');

            }

        });

    }

    // =========================
    // LOGIN SUBMIT
    // =========================

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        console.log('Login form submitted');

        const email =
            document.getElementById('email').value.trim();

        const password =
            document.getElementById('password').value.trim();

        if (!email || !password) {

            alert('Please fill all fields');
            return;

        }

        const submitButton =
            document.getElementById('submit-btn');

        try {

            submitButton.disabled = true;
            submitButton.innerHTML = 'Logging in...';

            const response = await fetch(
                'http://127.0.0.1:8000/api/login',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            console.log('LOGIN RESPONSE:', data);

            if (response.ok) {

                // SAVE TOKEN
                localStorage.setItem('token', data.token);

                // SAVE USER
                localStorage.setItem(
                    'user',
                    JSON.stringify(data.user)
                );

                alert('Login successful');

                // =========================
                // ROLE REDIRECT
                // =========================

                if (
                    data.user.role === 'system_admin' ||
                    data.user.role === 'admin'
                ) {

                    window.location.href =
                        './admin-dashboard.html';

                }
                else if (data.user.role === 'seller') {

                    window.location.href =
                        './seller-dashboard.html';

                }
                else {

                    window.location.href =
                        './index.html';

                }

            } else {

                alert(
                    data.message ||
                    'Invalid credentials'
                );

            }

        } catch (error) {

            console.error('LOGIN ERROR:', error);

            alert('Server error');

        } finally {

            submitButton.disabled = false;

            submitButton.innerHTML = 'Login';

        }

    });

});