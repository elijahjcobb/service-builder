/**
 *
 * Elijah Cobb
 * elijah@elijahcobb.com
 * https://elijahcobb.com
 *
 *
 * Copyright 2019 Elijah Cobb
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

import * as FileSystem from "fs";
import * as Readline from "readline";

const reader: Readline.Interface = Readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

function ask(question: string): Promise<string> {

	return new Promise<string>(((resolve: Function, reject: Function): void => {

		reader.question(question, (answer: string): void => {

			reader.close();
			resolve(answer);

		});

	}));

}

function answerIsBad(answer: string): boolean {

	const res: boolean =  answer.length === 0 || answer === " " || !Number.isNaN(parseInt(answer));
	if (res) console.error("Try again...");
	return res;

}

async function askName(): Promise<string> {

	const answer: string = await ask("Name: ");
	if (answer.indexOf(" ") !== -1) {
		console.error("No spaces. Try again...");
		return askName();
	}
	if (answerIsBad(answer)) return askName();
	else return answer;

}

async function askDescription(): Promise<string> {

	const answer: string = await ask("Description: ");
	if (answerIsBad(answer)) return askDescription();
	else return answer;

}

async function askWorkingDirectory(): Promise<string> {

	let answer: string = await ask(`Working Directory (${__dirname}): `);
	if (answer.length === 0) answer = __dirname;
	if (!FileSystem.existsSync(answer)) {
		console.error("The directory you specified does not exist.");
		return askWorkingDirectory();
	}
	if (answerIsBad(answer)) return askWorkingDirectory();
	else return answer;

}

async function askExecution(): Promise<string> {

	let answer: string = await ask(`Execution (${process.execPath} ./index.js): `);
	if (answer.length === 0) answer = process.execPath;
	if (answerIsBad(answer)) return askExecution();
	else return answer;

}

async function getValues(): Promise<void> {

	if (process.platform !== "linux") {
		console.error("This package only works for systemctl services in Linux. Be a penguin.");
		return;
	}

	const name: string = await askName();
	const description: string = await askDescription();
	const workingDirectory: string = await askWorkingDirectory();
	const execution: string = await askExecution();

	let template: string = `
		[Unit]
		Description=${description}
		After=network.target

		[Service]
		type=simple
		User=root
		WorkingDirectory=${workingDirectory}
		ExecStart=${execution}

		[Install]
		WantedBy=multi-user.target
		Alias=${name}
	`;

	template = template.replace(RegExp("\t", "g"), "");
	const servicePath: string = `/etc/systemd/system/${name}.service`;

	if (FileSystem.existsSync(servicePath)) {
		console.error("A service already exists for this name.");
		return;
	}

	FileSystem.writeFileSync(servicePath, Buffer.from(template, "utf8"));

	console.log("Done");

}

getValues().then().catch();