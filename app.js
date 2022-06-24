const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const app = express();

app.use(express.json());

const databasePath = path.join(__dirname, "todoApplication.db");

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const todoDetails = (todo) => {
  const date = todo.due_date;
  return {
    id: todo.id,
    todo: todo.todo,
    priority: todo.priority,
    status: todo.status,
    category: todo.category,
    dueDate: format(new Date(date), "yyyy-MM-dd"),
  };
};
const statusDetails = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const priorityDetails = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const priorityAndStatusDetails = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const categoryDetails = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const categoryAndPriorityDetails = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const categoryAndStatusDetails = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
/*---------------------------------single-----------------------------*/
app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "", category } = request.query;
  let getTodoQuery = "";
  let data;
  switch (true) {
    case statusDetails(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `
                SELECT 
                    *
                FROM 
                    todo 
                WHERE 
                    status = '${status}';`;
        data = await database.all(getTodoQuery);
        response.send(data.map((eachTodo) => todoDetails(eachTodo)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case priorityDetails(request.query):
      if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH") {
        getTodoQuery = `
                SELECT 
                    *
                FROM 
                    todo
                WHERE 
                    priority = '${priority}';`;
        data = await database.all(getTodoQuery);
        response.send(data.map((eachTodo) => todoDetails(eachTodo)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case categoryDetails(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `
                SELECT 
                    *
                FROM 
                    todo 
                WHERE 
                    category = '${category}';`;
        data = await database.all(getTodoQuery);
        response.send(data.map((eachTodo) => todoDetails(eachTodo)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    /*----------------------------multiple ---------------------------------*/
    case priorityAndStatusDetails(request.query):
      if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                        SELECT 
                            *
                        FROM 
                            todo 
                        WHERE 
                            status = '${status}'
                            priority = '${priority}';`;
          data = await database.all(getTodoQuery);
          response.send(data.map((eachTodo) => todoDetails(eachTodo)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case categoryAndStatusDetails(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                        SELECT 
                            *
                        FROM 
                            todo 
                        WHERE 
                            status = '${status}'
                            category = '${category}';`;
          data = await database.all(getTodoQuery);
          response.send(data.map((eachTodo) => todoDetails(eachTodo)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case categoryAndPriorityDetails(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "LOW" ||
          priority === "MEDIUM" ||
          priority === "HIGH"
        ) {
          getTodoQuery = `
                SELECT 
                    *
                FROM 
                    todo
                WHERE 
                    priority = '${priority}'
                    category = '${category}';`;
          data = await database.all(getTodoQuery);
          response.send(data.map((eachTodo) => todoDetails(eachTodo)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodoQuery = `
        SELECT 
             *
        FROM 
            todo
        WHERE 
            todo LIKE '%${search_q}%'`;
      data = await database.all(getTodoQuery);
      response.send(data.map((eachTodo) => todoDetails(eachTodo)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT 
             *
        FROM 
            todo
        WHERE 
            id = ${todoId};`;
  const data = await database.get(getTodoQuery);
  response.send(todoDetails(data));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getTodoQuery = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            due_date = '${newDate}';`;
    const data = await database.all(getTodoQuery);
    response.send(data.map((eachTodo) => todoDetails(eachTodo)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  let addTodoQuery;

  if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          addTodoQuery = `
                        INSERT INTO todo (id,todo,priority,status,category,due_Date)
                        VALUES (${id},'${todo}','${priority}','${status}','${category}','${newDate}');`;
          await database.run(addTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  const getTodoQuery = `
    SELECT 
        *
    FROM 
        todo 
    WHERE 
        id = ${todoId};`;
  const previousTodo = await database.get(getTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updateQuery;
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateQuery = `
                UPDATE todo
                SET 
                    todo = '${todo}',
                    priority = '${priority}',
                    status = '${status}',
                    category = '${category}',
                    due_date = '${dueDate}'
                WHERE 
                    id = ${todoId};`;
        await database.run(updateQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH") {
        updateQuery = `
                UPDATE todo
                SET 
                    todo = '${todo}',
                    priority = '${priority}',
                    status = '${status}',
                    category = '${category}',
                    due_date = '${dueDate}'
                WHERE 
                    id = ${todoId};`;
        await database.run(updateQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case requestBody.todo !== undefined:
      updateQuery = `
                UPDATE todo
                SET 
                    todo = '${todo}',
                    priority = '${priority}',
                    status = '${status}',
                    category = '${category}',
                    due_date = '${dueDate}'
                WHERE 
                    id = ${todoId};`;
      await database.run(updateQuery);
      response.send("Todo Updated");
      break;

    case requestBody.category !== undefined:
      if (
        category === "LEARNING" ||
        category === "HOME" ||
        category === "WORK"
      ) {
        updateQuery = `
                UPDATE todo
                SET 
                    todo = '${todo}',
                    priority = '${priority}',
                    status = '${status}',
                    category = '${category}',
                    due_date = '${dueDate}'
                WHERE 
                    id = ${todoId};`;
        await database.run(updateQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateQuery = `
                UPDATE todo
                SET 
                    todo = '${todo}',
                    priority = '${priority}',
                    status = '${status}',
                    category = '${category}',
                    due_date = '${newDate}'
                WHERE 
                    id = ${todoId};`;
        await database.run(updateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM todo WHERE id = ${todoId};`;
  await database.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
