HireFlow is a recruitment platform that streamlines candidate assessment through behavioral, personality, and cognitive testing. 
It provides hiring managers with secure access to comprehensive candidate insights, enabling data-driven hiring decisions by 
identifying each applicant's strengths and development areas in an organized dashboard interface.

To run, 
1. Input your credentials inside .env and also makefile, as shown below:
DB_DSN="postgresql://<username>:<password>@<host>:<port>/<database>?sslmode=disable"

2. Run the command "make migrate-up"

3. Create an account for admin by running the endpoint "/sign-up"
   with body JSON:
   {
    "email":"admin@gmail.com",
    "password": "testtest",
    "role_id":1,
    "name":"admin"
    }

4. Run the command " go run main.go " and also cd to a folder called fe, and run "npm run dev"

5. Register an account on this url http://localhost:5173/register

6. Login and do the behavioral, cognitive, and personality test.

7. If you want to look at the candidate results, then just login as an admin.
