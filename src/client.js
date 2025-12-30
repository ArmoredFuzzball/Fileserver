function requestFiles() {
    const request = new XMLHttpRequest();
    request.addEventListener('load', () => {
        document.getElementById('files').innerHTML = '';
        for (const file of JSON.parse(request.responseText)) {
            const link = document.createElement('a');
            link.href      = './' + file;
            link.innerText = file;
            const deleteButton     = document.createElement('button');
            deleteButton.innerText = 'Delete';
            deleteButton.addEventListener('click', () => deleteFile(file));
            document.getElementById('files').appendChild(link);
            document.getElementById('files').appendChild(document.createTextNode(' '));
            document.getElementById('files').appendChild(deleteButton);
            document.getElementById('files').appendChild(document.createElement('br'));
        }
    });
    request.open('GET', './get');
    request.send();
}

function deleteFile(file) {
    const deleteRequest = new XMLHttpRequest();
    deleteRequest.addEventListener('load', () => requestFiles());
    deleteRequest.open('DELETE', './' + file);
    deleteRequest.send();
}

window.addEventListener('load', () => {
    setInterval(() => requestFiles(), 3000);
    requestFiles();
    const form = document.getElementById('uploadForm');
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (document.getElementById('file').files[0].size > 15e+9) return alert('File is too big!');
        const startTime = Date.now();
        const request = new XMLHttpRequest();
        request.upload.addEventListener('progress', (event) => {
            const percent = (event.loaded / event.total) * 100;
            document.getElementById('progressNumber').innerText = percent.toFixed(2) + '%';

            document.getElementById('timeRemaining').innerText = timeRemaining(startTime, percent);

            const uploadSpeed = (event.loaded * 8) / ((Date.now() - startTime) * 1000);
            document.getElementById('uploadSpeed').innerText = uploadSpeed.toFixed(1) + ' mbit/sec';

            if (percent == 100) document.getElementById('progressNumber').innerText = 'Processing...';
        });
        request.addEventListener('load', () => {
            document.getElementById('progressNumber').innerText = 'Done!';
            const totalTime = (Date.now() - startTime) / 1000;
            document.getElementById('timeRemaining').innerText = 'Took ' + Math.floor(totalTime / 60) + ' minutes and ' + Math.round(totalTime % 60) + ' seconds';
            requestFiles();
        });
        request.open('POST', './');
        request.send(new FormData(form));
        request.addEventListener('error', () => alert('Error uploading file!'));
    });
});

function timeRemaining(startTime, percent) {
    const timeRemaining = ((100 - percent) * (Date.now() - startTime)) / (1000 * percent);
    if (timeRemaining > 60) return Math.floor(timeRemaining / 60) + ' minutes and ' + Math.round(timeRemaining % 60) + ' seconds';
    return Math.round(timeRemaining) + ' seconds';
}