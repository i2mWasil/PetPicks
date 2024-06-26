// Password Toggle
document.addEventListener("DOMContentLoaded", function() {
    const passwordInput = document.getElementById("passwordInput");
    const togglePassword = document.getElementById("togglePassword");

    togglePassword.addEventListener("click", function() {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);
        
        // Toggle eye icon classes for visibility
        if (type === "text") {
            togglePassword.querySelector("i").classList.remove("fa-eye");
            togglePassword.querySelector("i").classList.add("fa-eye-slash");
        } else {
            togglePassword.querySelector("i").classList.remove("fa-eye-slash");
            togglePassword.querySelector("i").classList.add("fa-eye");
        }
    });
});





//validate password
function validateForm() {
    const password = document.getElementsByName('password')[0].value;
    const confirmPassword = document.getElementsByName('confirmPassword')[0].value;

    if (password.length < 8) {
        alert("Password must be at least 8 characters long");
        return false;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return false;
    }

    return true;
}








// LogOut redirect
document.addEventListener("DOMContentLoaded", function() {
    const logoutButton = document.querySelector('.log-out button');

    // Add event listener to the logout button
    logoutButton.addEventListener('click', function() {
        fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                // Redirect to the login page after successful logout
                window.location.href = '/login';
            } else {
                // Handle error if logout fails
                console.error('Logout failed');
            }
        })
        .catch(error => console.error('Error:', error));
    });
});


















//SignUp redirect
document.addEventListener("DOMContentLoaded", function() {
    // Get the sign-up link element
    const signUpLink = document.querySelector("#signupLink");

    // Add event listener to the sign-up link
    signUpLink.addEventListener("click", function(event) {
        // Prevent the default behavior of the link
        event.preventDefault();
        
        // Redirect to signup.html
        window.location.href = "../template/signup.html";
    });
});

























//NAVIGATION BAR
// Function to show or hide the navigation bar
function toggleNavBar(event) {
    const navBar = document.getElementById('navContainer');
    const screenHeight = window.innerHeight;
    const cursorY = event.clientY;
    const distanceFromBottom = screenHeight - cursorY;
    // If cursor is close to the bottom of the screen, show the navigation bar
    if (distanceFromBottom < 50) {
        navBar.style.transform = 'translateY(0)';
        document.body.style.overflowY = 'visible'; // Show vertical scrollbar
    } else {
        navBar.style.transform = 'translateY(100%)';
    }
}
// Add mousemove event listener to track cursor position and toggle navigation bar visibility
document.addEventListener('mousemove', toggleNavBar);
// Ensure that the mousemove event listener is always active
document.body.style.overflowY = 'visible';



















document.addEventListener('DOMContentLoaded', function () {
    var scrollContainer = document.querySelector('.trending-slide');
    var slides = document.querySelectorAll('.trending-slide img');
    var slideWidth = slides[0].offsetWidth;
    var backSlideBtn = document.getElementById('backSlide');
    var frontSlideBtn = document.getElementById('frontSlide');
    var slideLinks = document.querySelectorAll('.slide-link');

    // Ensure navigation buttons exist
    if (!backSlideBtn || !frontSlideBtn) {
        console.error('Navigation buttons not found.');
        return;
    }

    // Toggle button visibility based on scroll position
    function toggleButtonVisibility() {
        var scrollLeft = scrollContainer.scrollLeft;
        var maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;

        // If at the beginning, hide back button
        backSlideBtn.style.visibility = scrollLeft === 0 ? 'hidden' : 'visible';

        // If at the end, hide front button
        frontSlideBtn.style.visibility = scrollLeft === maxScrollLeft ? 'hidden' : 'visible';
    }

    // Add event listener for back button
    backSlideBtn.addEventListener("click", function () {
        scrollContainer.scrollLeft -= slideWidth;
        toggleButtonVisibility();
    });

    // Add event listener for front button
    frontSlideBtn.addEventListener("click", function () {
        scrollContainer.scrollLeft += slideWidth;
        toggleButtonVisibility();
    });

    // Add event listener for slide links
    slideLinks.forEach(function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            var slideNumber = parseInt(link.getAttribute('data-slide'));
            scrollContainer.scrollLeft = (slideNumber - 1) * slideWidth;
            toggleButtonVisibility();
        });
    });

    // Toggle button visibility when the page loads
    toggleButtonVisibility();

    // Toggle button visibility when scrolling
    scrollContainer.addEventListener('scroll', toggleButtonVisibility);
});




// CATEGORIES
document.addEventListener('DOMContentLoaded', function () {
    let scrollContainer = document.querySelector('.category');
    let slides = document.querySelectorAll('.category');
    let backBtn = document.getElementById('backBtn');
    let frontBtn = document.getElementById('frontBtn');
    // Smooth scrolling animation
    function scrollSmoothly(distance) {
        scrollContainer.scrollTo({
            left: scrollContainer.scrollLeft + distance,
            behavior: 'smooth'
        });
    }
    // Calculate slide width
    let slideWidth = slides[0].offsetWidth;
    // Add event listener for front button
    frontBtn.addEventListener("mouseover", () => {
        scrollSmoothly(slideWidth);
    });
    // Add event listener for back button
    backBtn.addEventListener("mouseover", () => {
        scrollSmoothly(-slideWidth);
    });
    // Hide back button initially
    if (scrollContainer.scrollLeft === 0) {
        backBtn.style.visibility = 'hidden';
    }
    // Hide buttons when scrolling reaches the edges
    scrollContainer.addEventListener('scroll', () => {
        let maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        if (scrollContainer.scrollLeft === 0) {
            backBtn.style.visibility = 'hidden';
        } else if (scrollContainer.scrollLeft >= maxScrollLeft) {
            frontBtn.style.visibility = 'hidden';
        } else {
            backBtn.style.visibility = 'visible';
            frontBtn.style.visibility = 'visible';
        }
    });
});










document.addEventListener("DOMContentLoaded", function() {
    // Get the sign-up link element
    const signUpLink = document.querySelector("#signupLink");

    // Add event listener to the sign-up link
    signUpLink.addEventListener("click", function(event) {
        // Prevent the default behavior of the link
        event.preventDefault();
        
        // Redirect to signup.html
        window.location.href = "../template/signup.html";
    });
});







//profile redirect
document.addEventListener('DOMContentLoaded', function() {
    // Get the profile button element
    const profileButton = document.getElementById('profile-button');

    // Add click event listener to the profile button
    profileButton.addEventListener('click', function(event) {
        // Redirect to profile.html
        window.location.href = '../template/profile.html?userId=${userId}';
    });
});





//Upload

// JavaScript to toggle the visibility of the upload form
// JavaScript to toggle the visibility of the upload form
document.addEventListener("DOMContentLoaded", function() {
    var uploadBtn = document.getElementById('upload-btn');
    var form = document.getElementById('upload');

    // Add event listener to the upload button
    uploadBtn.addEventListener('click', function() {
        if (form.style.display === 'none' || form.style.display === '') {
            form.style.display = 'block'; // Show the form
        } else {
            form.style.display = 'none'; // Hide the form
        }
    });
});











//Username













