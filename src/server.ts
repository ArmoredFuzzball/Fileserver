import express from 'express';
import compression from 'compression';
import fileUpload from 'express-fileupload';
import { readdirSync, unlinkSync } from 'fs';

process.loadEnvFile();

const path = process.env.SERVER_URL;
const port = process.env.SERVER_PORT;
const storagePath = process.env.FILE_STORAGE_PATH;

if (!path || !port || !storagePath) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const app = express();
app.use(compression());
app.use(path, express.static(storagePath));
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));

app.listen(port, () => console.log(`listening on port ${port}`));

app.get(path, (_, res) => res.sendFile('index.html', { root: 'src' }));
app.get(path + '/client.js',   (_, res) => res.sendFile('client.js',   { root: 'src' }));
app.get(path + '/favicon.ico', (_, res) => res.sendFile('favicon.ico', { root: 'src' }));
app.get(path + '/index.css',   (_, res) => res.sendFile('index.css',   { root: 'src' }));

app.post(path, (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) throw 'nofile';

    const file = req.files.file as fileUpload.UploadedFile;
    if (file.name.trim() === "" || file.name.includes('\\') || file.name.includes('/')) throw 'invalidname';

    file.mv(storagePath + file.name, (err) => {
      if (err) throw err;
      res.send('success');
    });
  } catch (error) {
    console.error(error);
    switch (error) {
      case 'nofile': res.status(400).send('No file uploaded'); break;
      case 'invalidname': res.status(400).send('Invalid file name'); break;
      default: res.status(500).send('Internal server error'); break;
    }
  }
});

app.get(path + '/get', (_, res) => res.send(readdirSync(storagePath)));

app.delete(path + '/:file', (req, res) => {
  const file = req.params.file;
  if (!file) return res.status(400).send('No file specified');
  if (typeof file !== 'string') return res.status(400).send('Specify a single file name');
  if (file.trim() === "") return res.status(400).send('File name cannot be empty');
  if (file.includes('\\') || file.includes('/')) return res.status(400).send('Invalid file name');
  unlinkSync(storagePath + file);
  res.send('success');
});