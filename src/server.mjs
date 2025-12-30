import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import fileUpload from 'express-fileupload';
import { readdirSync, unlinkSync } from 'fs';

const port = process.env.SERVER_PORT;
const path = process.env.SERVER_URL;
const storagePath = process.env.FILE_STORAGE_PATH;

const app = express();
app.use(compression({ threshold: 500 }));
app.use(path, express.static(storagePath));
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));

app.listen(port, () => console.log(`listening on port ${port}`));

app.get(path, (_, res) => res.sendFile('index.html', { root: 'src' }));
app.get(path + '/client.js', (_, res) => res.sendFile('client.js', { root: 'src' }));
app.get(path + '/favicon.ico', (_, res) => res.sendFile('favicon.ico', { root: 'src' }));

app.post(path, (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) throw 'nofile';

    const file = req.files.file;
    if (file.name.includes('/') || file.name.includes('\\') || file.name.trim() === "") throw 'invalidname';

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
  if (!file || file.trim() === "") return res.status(400).send('No file specified');
  if (file.includes('/')) return res.status(400).send('Invalid file name');
  unlinkSync(storagePath + file);
  res.send('success');
});