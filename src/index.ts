import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Authless Calculator",
		version: "1.0.0",
	});

	async init() {
		// Simple addition tool
		this.server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
			content: [{ type: "text", text: String(a + b) }],
		}));

		// Calculator tool with multiple operations
		this.server.tool(
			"calculate",
			{
				operation: z.enum(["add", "subtract", "multiply", "divide"]),
				a: z.number(),
				b: z.number(),
			},
			async ({ operation, a, b }) => {
				let result: number;
				switch (operation) {
					case "add":
						result = a + b;
						break;
					case "subtract":
						result = a - b;
						break;
					case "multiply":
						result = a * b;
						break;
					case "divide":
						if (b === 0)
							return {
								content: [
									{
										type: "text",
										text: "Error: Cannot divide by zero",
									},
								],
							};
						result = a / b;
						break;
				}
				return { content: [{ type: "text", text: String(result) }] };
			},
		);

		// Course management tools
		this.server.tool(
			"list_courses",
			{},
			async () => {
				// Mock course data
				const courses = [
					{ id: "cs101", name: "Introduction to Computer Science", instructor: "Dr. Smith" },
					{ id: "math201", name: "Calculus II", instructor: "Prof. Johnson" },
					{ id: "eng301", name: "Software Engineering", instructor: "Dr. Brown" }
				];
				return {
					content: [{
						type: "text",
						text: JSON.stringify(courses, null, 2)
					}]
				};
			}
		);

		this.server.tool(
			"get_course",
			{ course_id: z.string() },
			async ({ course_id }) => {
				// Mock course data
				const courses = {
					"cs101": { 
						id: "cs101", 
						name: "Introduction to Computer Science", 
						instructor: "Dr. Smith",
						description: "Basic concepts of computer science and programming",
						credits: 3
					},
					"math201": { 
						id: "math201", 
						name: "Calculus II", 
						instructor: "Prof. Johnson",
						description: "Advanced calculus topics including integration and series",
						credits: 4
					},
					"eng301": { 
						id: "eng301", 
						name: "Software Engineering", 
						instructor: "Dr. Brown",
						description: "Software development methodologies and project management",
						credits: 3
					}
				};
				const course = courses[course_id as keyof typeof courses];
				if (!course) {
					return {
						content: [{
							type: "text",
							text: `Course with ID '${course_id}' not found`
						}]
					};
				}
				return {
					content: [{
						type: "text",
						text: JSON.stringify(course, null, 2)
					}]
				};
			}
		);

		this.server.tool(
			"list_assignments",
			{ course_id: z.string() },
			async ({ course_id }) => {
				// Mock assignment data
				const assignments = {
					"cs101": [
						{ id: "hw1", title: "Variables and Data Types", due_date: "2025-10-15", points: 100 },
						{ id: "hw2", title: "Control Structures", due_date: "2025-10-29", points: 100 },
						{ id: "midterm", title: "Midterm Exam", due_date: "2025-11-12", points: 200 }
					],
					"math201": [
						{ id: "quiz1", title: "Integration Techniques", due_date: "2025-10-10", points: 50 },
						{ id: "hw3", title: "Series and Sequences", due_date: "2025-10-24", points: 100 },
						{ id: "final", title: "Final Exam", due_date: "2025-12-15", points: 300 }
					],
					"eng301": [
						{ id: "proj1", title: "Requirements Analysis", due_date: "2025-10-20", points: 150 },
						{ id: "proj2", title: "System Design", due_date: "2025-11-10", points: 200 },
						{ id: "proj3", title: "Implementation and Testing", due_date: "2025-12-05", points: 250 }
					]
				};
				const courseAssignments = assignments[course_id as keyof typeof assignments];
				if (!courseAssignments) {
					return {
						content: [{
							type: "text",
							text: `No assignments found for course '${course_id}' or course does not exist`
						}]
					};
				}
				return {
					content: [{
						type: "text",
						text: JSON.stringify(courseAssignments, null, 2)
					}]
				};
			}
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);
		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}
		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}
		return new Response("Not found", { status: 404 });
	},
};
