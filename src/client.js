function requestFiles() {
  const request = new XMLHttpRequest();
  request.addEventListener('load', () => {
    document.getElementById('files').innerHTML = '';
    const files = JSON.parse(request.responseText).sort((a, b) => a.localeCompare(b));
    for (const file of files) {
      const link = document.createElement('a');
      link.href = './' + file;
      link.innerText = file;
      const deleteButton = document.createElement('button');
      deleteButton.innerText = 'Delete';
      deleteButton.addEventListener('click', () => deleteFile(file));
      const filesContainer = document.getElementById('files');
      filesContainer.appendChild(deleteButton);
      filesContainer.appendChild(document.createTextNode(' '));
      filesContainer.appendChild(link);
      filesContainer.appendChild(document.createElement('br'));
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

let progressResetTimeout = null;

function uploadFile(file) {
  if (!file) return;
  if (file.size > 50e+9) return alert('File is too big!');

  // Clear any pending reset timeout from previous upload
  if (progressResetTimeout) {
    clearTimeout(progressResetTimeout);
    progressResetTimeout = null;
  }

  // Reset progress line for new upload
  document.getElementById('progressLine').innerText = '🚀 Starting upload...';

  const startTime = Date.now();
  const request = new XMLHttpRequest();

  request.upload.addEventListener('progress', (event) => {
    const percent = (event.loaded / event.total) * 100;
    const uploadSpeed = (event.loaded * 8) / ((Date.now() - startTime) * 1000);
    const timeLeft = timeRemaining(startTime, percent);

    if (percent == 100) {
      document.getElementById('progressLine').innerText = '⚙️ Processing...';
    } else {
      document.getElementById('progressLine').innerText = `📤 Uploading: ${percent.toFixed(1)}% • ${uploadSpeed.toFixed(1)} mbit/sec • ${timeLeft} remaining`;
    }
  });

  request.addEventListener('load', () => {
    const totalTime = (Date.now() - startTime) / 1000;
    document.getElementById('progressLine').innerText = `✅ Upload complete! Took ${Math.floor(totalTime / 60)}m ${Math.round(totalTime % 60)}s`;
    requestFiles();
    progressResetTimeout = setTimeout(() => {
      document.getElementById('progressLine').innerText = '✨ Ready to upload';
      progressResetTimeout = null;
    }, 5000);
  });

  request.addEventListener('error', () => alert('Error uploading file!'));

  const formData = new FormData();
  formData.append('file', file);
  request.open('POST', './');
  request.send(formData);
}

window.addEventListener('load', () => {
  // setInterval(() => requestFiles(), 3000);
  requestFiles();

  const form = document.getElementById('uploadForm');
  const fileInput = document.getElementById('file');
  const dropZone = document.getElementById('dropZone');
  const browseButton = document.getElementById('browseButton');

  // Handle form submission
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    uploadFile(fileInput.files[0]);
  });

  // Handle file input change (when user selects file via browse)
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) {
      uploadFile(fileInput.files[0]);
      fileInput.value = ''; // Reset file input to allow selecting the same file again
    }
  });

  // Browse button click
  browseButton.addEventListener('click', () => {
    fileInput.click();
  });

  // Drag and drop handlers
  dropZone.addEventListener('click', (e) => {
    if (e.target === dropZone || e.target.closest('.upload-icon') || e.target.closest('div') === dropZone.querySelector('div')) {
      fileInput.click();
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  });

  // Prevent default drag and drop on the whole page
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.body.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });
});

function timeRemaining(startTime, percent) {
  const timeRemaining = ((100 - percent) * (Date.now() - startTime)) / (1000 * percent);
  if (timeRemaining > 60) return Math.floor(timeRemaining / 60) + ' minutes and ' + Math.round(timeRemaining % 60) + ' seconds';
  return Math.round(timeRemaining) + ' seconds';
}