const PDFDocument = require("pdfkit");
const fs = require("fs");

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream("dummy-resume.pdf"));

doc.fontSize(25).text("Chinmay Maheshwari - Software Engineer", 100, 100);
doc.fontSize(15).text("Skills:", 100, 150);
doc.fontSize(12).text("I am proficient in React, Node.js, and MongoDB. I have also worked with Docker and AWS in the past. My primary language is Python.", 100, 180);

doc.end();
console.log("Created dummy-resume.pdf");
