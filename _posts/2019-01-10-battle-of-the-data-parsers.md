---
permalink: /blog/2019/01/battle-of-the-data-parsers/
title: "Athena vs Q: Battle of the Data Parsers"
last_modified_at: 2019-01-10T13:31:01-05:00
classes: wide
categories:
  - Blog
tags:
  - technology
  - programming
  - data
  - sql
header:
  image: /assets/images/traackr/athena-vs-q.png
---

## What are we fighting for?
Here at Traackr, we pull together data from a variety of sources and visualize it in various forms — bar charts, timelines,
etc. Typically, this data comes from APIs in the form of JSON or XML, formats most developers and their tools are well
equipped to handle. Now, our team has been tasked with a new data source in the format of... CSV... Artisanally crafted and
delivered by our data team... Oh, joy... We will be getting these on a regular basis, and they are not small files.

The APIs we use typically have an interface to search through the data and return what we need. CSV files are just lumps
of text formatted into columns. What we need is some way to easily query that data. We could roll our own solution to
parse the files and store them away in MySQL, MongoDB, etc. However, someone must have invented this wheel already.
Surely, there must be a solution we could leverage rather than building our own process and infrastructure.

## Here comes a new challenger...
Traackr uses a variety of Amazon services, and Amazon's services are legion. I began searching through their list and
found an interesting item... [Amazon Athena](https://aws.amazon.com/athena/). The one line service description was "Query
data in S3 using SQL". Intriguing... Let's read on...

"...works with a variety of standard data formats, including CSV..." What?! You're telling me our data team could dump
the CSV files into a bucket, and we could query it using a language we are very familiar with. That sounds too good to
be true! I must play with this... Now...

A quick chat with the keeper of our Amazon access got the ball rolling to be able to access Athena and start tinkering.
While discussing the use case with them, they mentioned they use a similar tool locally called [q](https://github.com/harelba/q).
Excellent! I now have two combatants to duke it out in the arena and see what solution might best fit our needs. The
initial battle is over; time to break down the fight blow by blow.

## Ease and cost of setup
[Setting up q](http://harelba.github.io/q/install.html) is a straightforward process of installing the package through
your operating system's package manager. I use OS X myself making it a quick call to [brew](https://brew.sh/). It is
also a free open source tool, so no out of pocket expenses incurred. After installation, I am ready to run queries
against CSV files on my drive.

If you have ever worked with any Amazon service, you'll know setting something up is never quite that simple. Athena
needs a bucket in S3 to house the CSV files. Right... Not a huge time consuming task, but that storage will add to our
monthly costs. Bucket created... Some folders under the bucket created to separate the CSV files by type... CSV files
uploaded... Now what?

Next, you have to create a database in Athena. There is a decent UI for doing this, so not a huge time hurdle there. A
database has to have some tables to query; Athena creates tables by defining what S3 bucket the source data is held and
what data types and names you want for each column in the data. Some of the non-CSV data sources have ways to auto-discover
and build the tables for you.

Unfortunately, there was no auto-generation I could find for CSV files. The UI for building the tables manually is
decent but a bit clunky. However, once you have built one table, you can use the UI to issue a command to get the
`CREATE TABLE` syntax used to create it. Armed with this, you can easily modify the query for other tables and issue it
directly. With my tables built, what then will Amazon charge me for using this service? Turns out the pricing is US$5 per
terabyte of data scanned. Amazon has recommendations on how you can partition and compress your data to reduce the amount
of scanning. Our CSV files are large but not large enough to likely push us over that price point too often. Time will
tell...

There is one additional cost to Athena that is not readily apparent though. When you query data, Athena creates and
stores two files — one is a CSV file with the results of the query and the other is a file with metadata about the query.
These files are stored in another S3 bucket (you can configure where that bucket lives or just have it use an
auto-generated bucket) meaning you will be paying storage fees beyond the fees for storing your source data. We'll likely
throw a caching layer in front of our use of Athena if we move forward with it, as we do with other API sources. Still,
something we need to keep in mind.

**Winner:** q takes the opening round for being quick to install and completely free.

**Current Score:** q 1 — Athena 0

## Show me how you set a table!
We've already shown how to build a table in Athena. The nice bit is adding data to that table is as easy as uploading a
new CSV file into the S3 bucket. That's it! Any query you issue against that table is going to pull from all files in
the bucket. No need for any "query against these things" logic beyond the standard "issue a query against this table"
SQL syntax.

q, however, is a command line tool requiring you to somehow tell it what files to operate on. This is done in the `FROM`
portion of the query you issue:

```sql
SELECT * FROM /path/to/file1.csv+/path/to/file2.csv+... WHERE...
```

Hmm... It would be easy enough to build a string in the proper format by globbing all the files out of directory. However,
this syntax raises a question. The list of files will do nothing but grow. How long before we reach some odd limit on the
length of the command you can issue? That's the sort of question that tends to be answered around 2AM when your most
important customer in Europe needs the data this would provide ASAP. We could build in logic to issue multiple commands
and then massage the data together. Ick... Sounds like a big ball of complex mud filled with nails...

**Winner:** Athena evens things up by having tables grow simply by uploading a new file.

**Current Score:** q 1 — Athena 1

## I have questions... How do I get my answers?
Both Athena and q boast the ability to query the CSV files using SQL, and they both do exactly that. I can issue this
SQL against either and get the same data back:

```sql
SELECT first_name, last_name, location
FROM users
WHERE first_name = 'Odin'
```

The only initial difference is the table name for q is a file path. q supports the [SQLite syntax](http://www.sqlite.org/lang.html).
Athena is based on [Presto](https://prestodb.io/docs/0.172/index.html) but does not support all of Presto's features.
However, the [list of what is supported](https://docs.aws.amazon.com/athena/latest/ug/functions-operators-reference-section.html)
seems sufficient for our needs.

One item did stand out though. I can use `LIMIT` and `OFFSET` with q to get pages of data. Athena supports `LIMIT` but
not `OFFSET`. After some research, this appears to be due to the architectural and conceptual mindsets behind the Presto
engine. You get back all the data in one go due to how it parses things.

**Winner:** Too close to call... Both satisfy the SQL needs to pull the data from the files. The loss of `OFFSET` in
Athena is not a significant blow. Call it a draw.

**Current Score:** q 2 — Athena 2

## I want to change the design of my table
We all know data formats never, ever change. #sarcasm If the data were to change, how easy is it to alter your tables
accordingly? q has a straightforward answer. It simply doesn't care. It reads the header row from your CSV file and uses
that information for column names. Just adjust the column names in your query, and you are good to go.

Athena handles this differently. We had to explicitly define the table structure in Athena. Each column in the table
maps to a column in the CSV file in order. e.g., Column 0 in the table maps to column 0 in the CSV file, column 1 in the
table to column 1 in the file, etc. Any alteration in the file or alteration you wish to make to the table itself — new
columns added to the file, you want to rename a column in the table — require dropping the table and recreating it.

Recall the Athena UI has a way to get the `CREATE TABLE` syntax used to build a table. You would need to get that
statement, alter it, drop the existing table, and then issue the new command. The upside is you can drop the table
entirely without worrying about the data. It is stored in S3, and the table is "repopulated" once you create it again.

What happens though if your CSV files have no header row defining the column names? Athena has a slight edge here given
it doesn't need a header row. You define column X in the file is column Y in my table with the name I choose. q can
handle not having a header row, but the syntax for column references becomes numeric:

```sql
SELECT c1, c2, c3
FROM users
WHERE c2 = 'Odinson'
```

**Winner:** Again, too close to call... You are going to have to update _something_ with either tool when the table
structure changes. Neither the drop / recreate pattern in Athena nor q's numeric pattern for handling no header row in
the data seem to sway the judges either way. Another draw...

**Current Score:** q 3 — Athena 3

## Speed
Just how fast are these tools? It is difficult to make a true comparison here. I do not have enough files to work with
currently to say how they perform at scale. I also have yet to throw the actual SQL statements we would need (they are
still being forged in the dark places) to use against both tools. q certainly feels slightly faster, but nothing about
Athena's performance has given me concerns yet.

**Winner:** Not enough data to go on. No points awarded.

**Current Score:** q 3 — Athena 3

## How would I integrate them?
The final and most important round... If I were to use this tool, how would I go about integrating it into our stack and
workflow? Either tool requires some interface for our data team to upload new files. They don't care where the files end
up; they just need to ensure they are available for use. The difference between having a web form dump those files into
S3 or a disk elsewhere is marginal.

q is a command line tool, so it would not be terribly difficult to issue a system call and get the results back. The
results returned though are just the lines directly from the files. We would have to do some additional parsing after
the fact to break things down into named bits. Hrm... That means carrying the logic of the row result structure around
and needing to alter it if the data format ever changes. Combine that with the concern on having to find and concatenate
file paths and the length of said file paths on the command line execution... I think q may be on the ropes.

Amazon provides an [SDK](https://aws.amazon.com/tools/#sdk) for most of the frequently used programming languages, and
the ones I would need have support for using Athena. Query results are just an API call away via the SDK, and they come
back in an array of data. The format of that array is interesting.

```php
Aws\Result Object
(
    [data:Aws\Result:private] => Array
        (
            [UpdateCount] => 0
            [ResultSet] => Array
                (
                    [Rows] => Array
                        (
                            [0] => Array
                                (
                                    [Data] => Array
                                        (
                                            [0] => Array
                                                (
                                                    [VarCharValue] => first_name
                                                )
 
                                            [1] => Array
                                                (
                                                    [VarCharValue] => last_name
                                                )
 
                                            [2] => Array
                                                (
                                                    [VarCharValue] => location
                                                )
                                        )
                                )
                            [1] => Array
                                (
                                    [Data] => Array
                                        (
                                            [0] => Array
                                                (
                                                    [VarCharValue] => Thor
                                                )
 
                                            [1] => Array
                                                (
                                                    [VarCharValue] => Odinson
                                                )
 
                                            [3] => Array
                                                (
                                                    [VarCharValue] => Asgard
                                                )
                                        )
                                )
...
```

The first row in the data set is essentially the table definition with subsequent rows being the actual data. While we
don't get back the data in a typical SQL-esque fashion — each entry in the array is an associative array with the key
being column name, we could easily build a parser / formatter to take that first row of data and use it to return a
similar structure. That is one bit of coding that can handle any data changes down the line.

**Winner:** Athena lands a solid blow to q's gut by not needing to worry about having to update code any time the data format
changes.

**Current Score:** Athena 4 — q 3

## Here is your winner...
![Athena](/assets/images/traackr/athena.jpg){: .align-left}Athena wins with a decisive knock out blow in the final round.
While you do have some operating expenses in its use of S3 and scanning the data, Athena provides everything we need to
process CSV data and serve it up to our customers. Our developers can query the data in SQL like they would with any
other data source through the SDK API calls. Given it can parse other file formats, this is definitely a tool I can see
reaching for more frequently.