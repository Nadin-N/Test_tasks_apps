class Templates {
	#items = {};

	constructor() {
		this.#getTemplates();
	}

	#getTemplates() {
		const templatesList = document.querySelectorAll("template");

		templatesList.forEach(
			(template) => (this.#items[template.dataset["name"]] = template.content.cloneNode(true))
		);
	}

	getQuestion(content, nextFn) {
		const fragment = this.#items["question"].cloneNode(true);

		const { question, answers } = content;

		const title = fragment.querySelector(".poll-list-question");
		const answerBox = fragment.querySelector(".poll-answer-buttons");

		title.textContent = question;
		answers.forEach((answer) => answerBox.append(this.#getAnswerBtn(answer, nextFn)));

		return fragment;
	}

	#getAnswerBtn(answer, nextFn) {
		const fragment = this.#items["answer"].cloneNode(true);

		const btn = fragment.querySelector("button");
		const { title, value } = answer;

		btn.textContent = title;
		btn.dataset["value"] = value;

		btn.addEventListener("click", () => nextFn(answer));

		return fragment;
	}

	getReport(report) {
		const fragment = this.#items["report-list"].cloneNode(true);
		const list = fragment.querySelector(".poll-report");

		report.forEach((item) => {
			const itemFragment = this.#getReportItem(item);

			list.append(itemFragment);
		});

		return fragment;
	}

	#getReportItem(item) {
		const fragment = this.#items["report-item"].cloneNode(true);

		const { question, title: answer } = item;

		const questionTitle = fragment.querySelector(".report-list-question");
		const questionAnswer = fragment.querySelector(".report-list-answer");

		questionTitle.textContent = question;
		questionAnswer.textContent = answer;

		return fragment;
	}
}

class Poll {
	static URL = "../public/task-03/questions.json";
	static HIDDEN_CLASS = "is-hidden";
	constructor() {
		this.refs = {
			startBtn: document.querySelector(".poll-start-button"),
			restartBtn: document.querySelector(".poll-restart-button"),
			pollResults: document.querySelector(".poll-result-box"),
			question: document.querySelector(".poll-box"),
		};

		this.template = new Templates();
		this.questions = null;
		this.report = null;

		this.addListeners();
	}

	addListeners() {
		this.refs.startBtn.addEventListener("click", this.startPoll.bind(this));
		this.refs.restartBtn.addEventListener("click", this.restartPoll.bind(this));
	}

	startPoll() {
		this.refs.startBtn.classList.add(Poll.HIDDEN_CLASS);
		this.refs.question.classList.remove(Poll.HIDDEN_CLASS);

		this.fetchQuestion();
	}

	restartPoll() {
		this.refs.pollResults.innerHTML = "";
		this.refs.question.classList.remove(Poll.HIDDEN_CLASS);
		this.refs.restartBtn.classList.add(Poll.HIDDEN_CLASS);

		this.report = null;

		this.fetchQuestion();
	}

	async fetchQuestion() {
		if (this.questions && this.questions.length) {
			return;
		}

		const response = await fetch(Poll.URL);

		if (!response.ok) {
			return new Error(response.status);
		}

		this.questions = await response.json();

		this.renderQuestions();
	}

	renderQuestions() {
		if (this.questions && !this.questions.length) {
			this.showReport();

			return;
		}

		const [question] = this.questions;
		const markup = this.template.getQuestion(question, this.nextQuestion.bind(this, question));

		question.completed = true;

		this.refs.question.replaceChildren(markup);
	}

	nextQuestion({ question }, { title, children }) {
		this.report = this.report ? [...this.report, { question, title }] : [{ question, title }];

		if (!children) {
			this.clearQuestions();
		} else {
			this.questions = [...children, ...this.questions];

			this.clearQuestions();
		}
	}

	clearQuestions() {
		this.questions = this.questions.filter((item) => !item.completed);

		this.renderQuestions();
	}

	showReport() {
		this.refs.question.innerHTML = "";

		const markup = this.template.getReport(this.report);

		this.refs.pollResults.classList.remove(Poll.HIDDEN_CLASS);
		this.refs.restartBtn.classList.remove(Poll.HIDDEN_CLASS);
		this.refs.question.classList.add(Poll.HIDDEN_CLASS);

		this.refs.pollResults.appendChild(markup);
	}
}

new Poll();
