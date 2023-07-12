"use strict";
class DistanceConverter {
	constructor() {
		this.convertFormEl = document.querySelector(".convert-form");
		this.resultValueEl = document.querySelector(".convert-result-value");

		this.equality = null;

		this.fetchLengthEquality();
		this.addListeners();
	}

	addListeners() {
		this.convertFormEl.addEventListener("submit", this.calculate.bind(this));
	}

	async fetchLengthEquality() {
		if (this.equality) {
			return;
		}

		const response = await fetch("../public/task-01/lengthEquality.json");

		if (!response.ok) {
			return new Error(response.status);
		}

		this.equality = await response.json();

		this.renderSelect("#convert-from-unit");
		this.renderSelect("#convert-to-unit");
	}

	calculate(event) {
		event.preventDefault();

		const { inputValue, fromUnit, toUnit } = event.currentTarget.elements;
		const target = this.equality.find((item) => item.name === fromUnit.value);
		const equalMultiplier = target.values[toUnit.value];
		const valueToConvert = Number(inputValue.value);
		const result = equalMultiplier * valueToConvert;

		this.resultValueEl.textContent =
			result >= 0.01 || result === 0 ? result.toFixed(2) : result.toExponential(2);
	}

	renderSelect(selector) {
		const options = this.equality.reduce(
			(acc, item) => `${acc}<option value="${item.name}">${item.title} (${item.shortcut})</option>`,
			""
		);
		const target = document.querySelector(selector);

		target.innerHTML = options;
	}
}

new DistanceConverter();
