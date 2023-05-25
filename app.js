const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");

const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const checkRequestsQuery = async (request, response, next) => {
  const { search_q, category, priority, status, date } = request.query;
  const todoId = request.params;

  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryIsInArray = categoryArray.includes(category);
    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
  if (date !== undefined) {
    try {
      const myDate = new Date(date);
      const formatDate = formate(new Date(date), "yyyy-MM-dd");
      console.log(formatDate, "f");
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );
      console.log(result, "r");
      console.log(new myDate(), "new");

      const isValidDate = await isValid(result);
      if (isValidDate === true) {
        request.date = formatDate;
        return;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.search_q = search_q;
  request.todoId = todoId;
  next();
};

const checkRequestBody = (request, response, next) => {
  const { id, todo, status, priority, category, dueDate } = request.body;
  const { todoId } = request.params;
  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryIsInArray = categoryArray.includes(category);
    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }
  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate);
      const formatDate = formate(new Date(dueDate), "yyyy-MM-dd");
      console.log(formatDate, "f");
      const result = toDate(new Date(formatDate));
      console.log(result, "r");
      console.log(new myDate(), "new");

      const isValidDate = isValid(result);
      if (isValidDate === true) {
        request.date = formatDate;
        return;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.id = id;
  request.todo = todo;
  request.todoId = todoId;
  next();
};

// API 1
app.get("/todos/", checkRequestsQuery, async (request, response) => {
  const { status = "", priority = "", search_q = "", category = "" } = request;
  console.log(status, priority, search_q, category);
  const getTodoQuery = `SELECT
            id,
            todo,
            priority,
            status,
            category,
            due_date as dueDate
        FROM
            todo
        WHERE
            todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%'
            AND status LIKE '%${status}%' AND category LIKE '%${category}%';        
            `;
  const todoArray = await db.all(getTodoQuery);
  response.send(todoArray);
  console.log(todoArray);
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT
                               id,
                               todo,
                               priority,
                               status,
                               category,
                               due_date AS dueDate
                            FROM 
                                todo
                            WHERE
                                id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//API 3
app.get("/agenda/", checkRequestsQuery, async (request, response) => {
  const { date } = request;
  console.log(date, "a");
  const getDateQuery = `SELECT
                               id,
                               todo,
                               priority,
                               status,
                               category,
                               due_date AS dueDate
                            FROM 
                                todo
                            WHERE
                                due_date = '${date}';`;
  const dateArray = await db.all(getDateQuery);
  if (dateArray === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    response.send(dateArray);
  }
});

//API 4
app.post("/todos/", checkRequestBody, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request;
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status,category, due_date)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}' , '${category}' , '${dueDate}');`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//API 5
app.put("/todos/:todoId/", checkRequestBody, async (request, response) => {
  const { todoId } = request;
  const { status, category, priority, todo, dueDate } = request;
  switch (true) {
    case status !== undefined:
      const updateStatusQuery = `UPDATE
                                                todo
                                              SET
                                                status = '${status}'
                                              WHERE
                                                id = ${todoId};`;
      await db.run(updateStatusQuery);
      response.send("Status Updated");
      break;
    case category !== undefined:
      const updateCategoryQuery = `UPDATE
                                                todo
                                              SET
                                                category = '${category}'
                                              WHERE
                                                id = ${todoId};`;
      await db.run(updateCategoryQuery);
      response.send("Category Updated");
      break;
    case priority !== undefined:
      const updatePriorityQuery = `UPDATE
                                                todo
                                              SET
                                                priority = '${priority}'
                                              WHERE
                                                id = ${todoId};`;
      await db.run(updatePriorityQuery);
      response.send("Priority Updated");
      break;
    case todo !== undefined:
      const updateTodoQuery = `UPDATE
                                                todo
                                              SET
                                                todo = '${todo}'
                                              WHERE
                                                id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    case dueDate !== undefined:
      const updateDueDateQuery = `UPDATE
                                                todo
                                              SET
                                                due_date = '${dueDate}'
                                              WHERE
                                                id = ${todoId};`;
      await db.run(updateDueDateQuery);
      response.send("Due Date Updated");
      break;
  }
});

// API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM
                                    todo
                                WHERE
                                    id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
