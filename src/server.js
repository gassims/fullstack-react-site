import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';


const app = express();

app.use(express.static(path.join(__dirname, 'build')))
app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('db-fullstackreact');
    
        await operations(db);
    
        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error connecting to db', error });
    }
}

app.get('/api/stories/:name', async (req, res) => {
    withDB(async (db) => {
        const storyName = req.params.name;

        const storyInfo = await db.collection('stories').findOne({ name: storyName })
        res.status(200).json(storyInfo);
    }, res);
})

app.post('/api/stories/:name/upvote', async (req, res) => {
    withDB(async (db) => {
        const storyName = req.params.name;
    
        const storyInfo = await db.collection('stories').findOne({ name: storyName });
        await db.collection('stories').updateOne({ name: storyName }, {
            '$set': {
                upvotes: storyInfo.upvotes + 1,
            },
        });
        const updatedStoryInfo = await db.collection('stories').findOne({ name: storyName });
    
        res.status(200).json(updatedStoryInfo);
    }, res);
});

app.post('/api/stories/:name/add-comment', (req, res) => {
    const { username, text } = req.body;
    const storyName = req.params.name;

    withDB(async (db) => {
        const storyInfo = await db.collection('stories').findOne({ name: storyName });
        await db.collection('stories').updateOne({ name: storyName }, {
            '$set': {
                comments: storyInfo.comments.concat({ username, text }),
            },
        });
        const updatedStoryInfo = await db.collection('stories').findOne({ name: storyName });

        res.status(200).json(updatedStoryInfo);
    }, res);
});

app.get('*', (req,res)=> {
    res.sendFile(path.join(__dirname + '/build/index.html')); //all uncaught request passed to the app
})

app.listen(8000, () => console.log('Listening on port 8000'));