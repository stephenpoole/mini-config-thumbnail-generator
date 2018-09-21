const app = require('express')(),
    helmet = require('helmet');

app.set('json spaces', 4);
app.use(helmet());
app.get('/', (req, res) => {
    res.send(200);
});
app.all('*', (req, res) => {
    respond(res, 404);
});
app.listen(3000, () => console.log('listening on port 3000'));
