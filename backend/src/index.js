const express = require('express')
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({status: 'ok'}));
const books = [
  { title: "The Hobbit", author: "J.R.R. Tolkien", genre: "Fantasy" },
  { title: "1984", author: "George Orwell", genre: "Sci-Fi" },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", genre: "Classic" },
  { title: "Dune", author: "Frank Herbert", genre: "Sci-Fi" }
];

app.get('/api/books', (req, res) => res.json(books));

app.listen(PORT, () => console.log(`STEFAN WAS HERE ON PORT ${PORT}`))
