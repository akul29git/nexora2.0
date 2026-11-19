- what is the difference between dependencies and dev-dependencies 
	- **`dependencies`** are packages your application needs at runtime, in production. If your code imports it and the app breaks without it, it belongs here. Examples: `express`, `react`, `axios`, `lodash`.
	- **`devDependencies`** are packages only needed during development. They help you build, test, lint, or format, but aren’t needed when the app is actually running. Examples: `jest`, `eslint`, `prettier`, `typescript`, `webpack`, `nodemon`.
- `.gitignore` generators
- read what is **`iifes`**
	- Immediately Invoked Function Expression
	- these are the function expression which run Immediately after it is created
	- 
>after completing this project ..., look for the ways of optimizing the video such that the video is being able to load in like 3-4 seconds

- what is the difference between the async await and promise in js
	- a promise is a object that is available later 
	- async/await is a syntax built on top of the promise 
	- fetch does not need a promise it works as a promise internally
- URI 
	- is a uniform resource identifier
	- is the sequence of character used for uniquely identify a resource 

> in your current code the verification logics and function are missing 

- Classes in JS
	- constructor 
		- A constructor is a special method named `constructor` that runs automatically when you call `new ClassName(...)`. It sets up the new object.
		- Parameters are only local variables. They become properties only if you store them with `this.name = name`.
		- Missing arguments are `undefined` (use default values to avoid this). Each instance gets its own copy of its properties.
	- inheritance with super
		- In `Student extends Person`, calling `super(name, age)` runs Person’s constructor on the same object, so `name` and `age` become properties of the Student object (`this.name`, `s.name`).
		- `super()` must come before any use of `this`, otherwise you get a `ReferenceError`.
		- If the subclass needs no extra properties, you can skip its constructor and the arguments pass to the parent automatically.
	- Methods inside constructor
		- Normally methods are **not** copied; they sit on `Person.prototype` and are shared.
		- A method defined inside the constructor **is** copied: a new function per object. This costs more memory.
		- Use it when you need **private data through closures** (e.g., a bank account’s `balance`) or per-instance `this` binding (arrow functions or `bind`).
		- The modern alternative is `#private` fields with prototype methods, which gives privacy without the memory cost.
- What is cookie 
	- In web development, a **cookie** is a small piece of data that a website stores in your browser. The browser sends it back to the server with every subsequent request to that site, which lets the server “remember” things about you across requests.
	- as we already know that http is stateless and every request is independent and server does not know "who am i " 
	- 
- `cors npm` package
	- with `cors` package we can  setup the multidomain thing ---`claude this`
	- The `cors` package lets you pass a **function** that receives the incoming request, so you can return different rules depending on which origin is calling. This is called a “delegate” (or dynamic options) function.
	- https://claude.ai/share/7761b093-3050-4b1d-95a7-ea9aed3f9994
- what is `express.js`
	- is a framework
	- node can handle HTTP request on its own but you have to write a huge pile of code for that
	- alternative choice can be `Hono`
- ```js
  app.use(express.json({limit:"16kb"}))
  app.use(express.urlencoded({extended:true,limit:"16kb"}))
  
  ```
- explanation
	- `express.urlencoded({ extended: true, limit: "10mb" })` lets your server read form data.
	- By default, Express does **not** read the request body, so `req.body` is `undefined`.
	- Body-parsing middleware reads the incoming data and puts it into `req.body`
	- Each middleware handles only **one content type**, checked through the `Content-Type`
	- `extended: true` allows nested objects and arrays.
	- `limit: "10mb"` raises the max body size from the 100kb default.
	- Remove both: `req.body` is `undefined` everywhere.
	- Remove only `urlencoded`: JSON works, forms don’t.
>checkout swagger ui
>also read this https://claude.ai/share/f705a1e4-f480-4268-86a5-52bf20824b79
- ```js
  app.get('/', (error,req, res,next) => {
  res.send('Hello World!')
})
  ```
- this keyword in JS
	- is for referencing current instance that has been created with new 
- Get method
	- is a method used to request the data from the server
- Prototypes in JS
- static method
	- marks a method as belonging to the **class itself** rather than to the objects created from it.
- ```js
  export default app  //way-1
  export {app}        //way-2 
  ```
- explanation
	- why curly brackets
		- without it `export default` will become necessary. Otherwise the you will be get the syntax error 
		- and you can have only one export default in one module
		- because
			- `export default` is the modules single main value and import syntax resolve it without any name
			- `default` slot is looked up by position not by name
			- `export default` creates one entry named "default" and the ES module spec require export names to be unique
			- 2 `export default` will give the duplicate error
		- and also for the `export default` the import name could be anything ...the slot thing
- we are using mongoose as the OMD(object data model)
- what is pagination
	- is the splitting of the huge database into separate numbered pages
> Read the mongoose docs
- there is buffer data type available with mongoose
- buffer
	- buffer in coding is a temporary storage area in memory used to hold data while it is being transferred between processes, devices, or components operating at different speeds.
>https://claude.ai/share/43ca08d9-c262-4085-8681-3b952cb569ca
- ### A good analogy
	- `reqisterUser` is like giving someone a **recipe card**: they can cook it whenever they want.
	- `reqisterUser()` is **cooking the meal right now** and handing over the food.
> make the login using email and register using email also because you can use `nodemailer` or resend mailer service to trigger mail also like the forgot password features

>https://claude.ai/share/3ebdb20c-587e-4613-a79f-ee7b6a33db27
>what does `npm run dev` do like under the hood

- in `js` context with mongoose, do not use arrow function with `.methods` because it prevents binding with `this`
### CI/CD pipeline
- CI/CD pipelines are structured workflows that automate the entire process of integrating, testing, and deploying code. These pipelines consist of five core stages that ensure quality and speed.
- need to setup lint, test, build
### testing for backend
- using `jest+supertest`
>send back the `access-control-Allow-origin` with the response header
>and also to see how to properly handle `cors` flow and see the requirements of preflight request
>
>see how to implement http caching





































# problems

>-how come the cookies are safe
>-what is the difference between the browser and postman
>-from where the one extra cookie is coming
>-on good website unknow URL are not allowed to hit 
>read https://claude.ai/share/ddf845e6-ccd8-4909-ac3b-c0e1bc7de645
# break points for the auth testing
- parallel login 
	- at every time login but the refresh token is getting renewed---don't let the refresh token get renewed
	- 
- 2 times /renew-access-token hit malfunctioned response
- 