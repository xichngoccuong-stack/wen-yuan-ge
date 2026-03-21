document.querySelector('header').style.display = 'none';

setTimeout(function() {
    document.getElementById('image').style.display = 'none';
    document.getElementById('video').style.display = 'block';
    document.querySelector('header').style.display = 'block';
}, 2000);