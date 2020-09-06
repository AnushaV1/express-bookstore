process.env.NODE_ENV = "test"
const app = require("../app")
const request = require("supertest")
const db = require("../db")
const Book = require("../models/book")

let testBook;

beforeEach(async () => {
    await db.query('DELETE FROM books')
    let result = await db.query(`
    INSERT INTO 
      books (isbn, amazon_url,author,language,pages,publisher,title,year)   
      VALUES(
        '1111122222', 
        'http://a.co/eobPtX2', 
        'New author', 
        'English', 
       400,  
        'Princeton publishers', 
        'Test book title', 2017) 
      RETURNING isbn`);

  book_isbn = result.rows[0].isbn
});

afterEach(async function () {
    await db.query("DELETE FROM BOOKS");
  });

afterAll(async() => {
    await db.end()
})

describe('GET /books', () => {
    test('Get list of all books', async() => {
        const res =await request(app).get('/books');
        const books = res.body.books;
        expect(res.statusCode).toBe(200)
        expect(res.body).toBeInstanceOf(Object);
        expect(books[0]).toHaveProperty("isbn");
    })
})

describe('GET /books/:isbn', ()=> {
test('Get single book with isbn', async() => {
    const res = await request(app).get(`/books/${book_isbn}`)
    expect(res.body.book).toHaveProperty("isbn");
    expect(res.body.book.isbn).toBe(book_isbn);
})
test("Respond with 404 if book not found", async () => {
    const resp = await request(app).get(`/books/99999`)
    expect(resp.statusCode).toBe(404);
})
})

describe('POST /books', () => {
    test('Create a new book', async () => {
        const resp = await request(app).post('/books')
        .send({
            isbn: '333333333',
            amazon_url: "https://amazon.com",
            author: "test author",
            language: "English",
            pages: 500,
            publisher: "Test publisher",
            title:"Test title",
            year: 2010
        });
        expect(resp.statusCode).toBe(201);
        expect(resp.body.book).toHaveProperty("isbn");
    })
    test('Missing fields', async () => {
        const resp = await request(app).post('/books').send({author:'sample author'});
        expect(resp.statusCode).toBe(400);
    })
})


describe("DELETE /books/:isbn", () => {
    test("Delete a single a book", async () => {
        const response = await request(app).delete(`/books/${book_isbn}`)
        expect(response.body).toEqual({message: "Book deleted"});
    })
})

describe("PUT /books/:isbn", async () => {
    test("updates a single book", async () => {
        const response = await request(app)
        .put(`/books/${book_isbn}`)
        .send({
            isbn: '44444444',
            amazon_url: "https://amazon.com/isbn",
            author: "test author",
            language: "English",
            pages: 500,
            publisher: "Test publisher",
            title:"title updated",
            year: 2010
        });
        expect(response.body.book).toHaveProperty("author");
        expect(response.body.book.title).toBe("title updated");
        expect(response.body).toBeInstanceOf(Object)
    });

    test("Prevents a bad book update", async function () {
        const response = await request(app)
            .put(`/books/${book_isbn}`)
            .send({
              amazon_url: "https://taco.com",
              author: "mctest",
              language: "english",
              pages: 1000,
              publisher: "yeah right",
              title: "UPDATED BOOK",
              year: 2000,
              ExtraField: "Try adding me!"
            });
        expect(response.statusCode).toBe(400);
      });

})






