class App {
	static CLOSE_FILTER_BTN_CODE = "Escape";
	static CLOSE_FILTER_CLASS = "visually-hidden";
	constructor() {
		this.refs = {
			filterBtn: document.querySelector(".filter-button"),
			filterModalEl: document.querySelector(".filter-modal"),
			filterWrapEl: document.querySelector(".filter-wrap"),
			filterFormEl: document.querySelector(".filter-form"),
			includeCategoryEl: document.querySelector("#filter-include-category"),
			includeValueEl: document.querySelector("#filter-include-value"),
			excludeCategoryEl: document.querySelector("#filter-exclude-category"),
			excludeValueEl: document.querySelector("#filter-exclude-value"),
			filterSortEl: document.querySelector("#filter-sort"),
			clearFilterBtn: document.querySelector(".filter-clear-button"),
			submitBtn: document.querySelector(".filter-submit-button"),
			selectElements: document.querySelectorAll(".filter-item select"),
			tableHeaderEl: document.querySelector(".table-header"),
			tableBodyEl: document.querySelector(".table-body"),
		};

		this.list = null;
		this.columns = null;

		this.fetchList();
		this.addListeners();
	}

	addListeners() {
		this.refs.filterBtn.addEventListener("click", this.showFilterForm.bind(this));
		this.refs.filterFormEl.addEventListener("submit", this.onSubmit.bind(this));
		this.refs.includeCategoryEl.addEventListener("change", this.changeIncludeValues.bind(this));
		this.refs.excludeCategoryEl.addEventListener("change", this.changeExcludeValues.bind(this));
		this.refs.clearFilterBtn.addEventListener("click", this.clearFilter.bind(this));
		this.refs.selectElements.forEach((element) => {
			if (element.name !== "filterSortCategorySelect") {
				element.addEventListener("change", this.validFilter.bind(this));
			}
		});
	}

	async fetchList() {
		if (this.list) {
			return;
		}

		const response = await fetch("../public/task-02/users.json");

		if (!response.ok) {
			return new Error(response.status);
		}

		this.list = await response.json();

		this.findColumns();
		this.render();
	}

	findColumns() {
		if (!this.list && !this.list.length) {
			return;
		}

		const [firstItem] = this.list;

		this.columns = Object.keys(firstItem);
	}

	render() {
		this.renderListHeader();
		this.renderList();
		this.renderFilterCategories();
	}

	renderListHeader() {
		const tableHeaderMarkup = this.columns.reduce(
			(acc, item) => `${acc}<th class="table-column">${item}</th>`,
			""
		);

		this.refs.tableHeaderEl.innerHTML = tableHeaderMarkup;
	}

	renderList(sortedItems) {
		const list = sortedItems || this.list;

		const markup = list.reduce((acc, item) => {
			const cells = Object.values(item).reduce((previousMarkup, value) => {
				const rowMarkup = value.toString().includes("@")
					? `<td><a href="mailto:${value}">${value}</a></td>`
					: `<td>${typeof value === "boolean" ? this.renameBoolean(value) : value}</td>`;

				return `${previousMarkup}${rowMarkup}`;
			}, "");

			const listMarkup = `<tr class="table-column">${cells}<tr/>`;

			return `${acc}${listMarkup}`;
		}, "");

		this.refs.tableBodyEl.innerHTML = markup;
	}

	renderFilterCategories() {
		const categoryItems = this.columns.reduce(
			(acc, item) => `${acc}<option value="${item}">${item}</option>`,
			""
		);

		this.refs.filterSortEl.insertAdjacentHTML("beforeend", categoryItems);
		this.refs.includeCategoryEl.insertAdjacentHTML("beforeend", categoryItems);
		this.refs.excludeCategoryEl.insertAdjacentHTML("beforeend", categoryItems);
	}

	renameBoolean(value) {
		return value ? "Yes" : "No";
	}

	defineCategoryValues(list, category, element) {
		if (!category) {
			return null;
		}

		const categoryValues =
			element.name === "filterExcludeValueSelect"
				? list
						.map((item) => item[category])
						.filter((item) =>
							typeof item === "string"
								? item.includes(this.refs.includeValueEl.value.toLowerCase())
								: item !== this.refs.includeValueEl.value.toLowerCase()
						)
				: list.map((item) => item[category]);

		const unique = [...new Set(categoryValues)].sort((current, next) =>
			Number.isNaN(current) ? current - next : current.toString().localeCompare(next.toString())
		);
		const selectMarkup = unique.reduce(
			(acc, item) =>
				`${acc}<option value="${item}">${
					typeof item === "boolean" ? this.renameBoolean(item) : item
				}</option>`,
			""
		);

		return selectMarkup;
	}

	changeSelectValues(event, element) {
		element.innerHTML = `<option value=""></option>`;
		if (event.target.value) {
			element.insertAdjacentHTML(
				"beforeend",
				this.defineCategoryValues(this.list, event.target.value, element)
			);
		}
	}

	changeIncludeValues(event) {
		this.changeSelectValues(event, this.refs.includeValueEl);
	}

	changeExcludeValues(event) {
		this.changeSelectValues(event, this.refs.excludeValueEl);
	}

	parseValue(value) {
		if (value === "true") {
			return true;
		} else if (value === "false") {
			return false;
		} else if (!isNaN(Number(value))) {
			return Number(value);
		} else return value;
	}

	validIncludeFilter() {
		return this.refs.includeCategoryEl.value ? this.refs.includeValueEl.value : true;
	}

	validExcludeFilter() {
		return this.refs.excludeCategoryEl.value ? this.refs.excludeValueEl.value : true;
	}

	validFilter() {
		this.refs.submitBtn.disabled = !this.validIncludeFilter() || !this.validExcludeFilter();
		this.refs.submitBtn.disabled
			? this.refs.submitBtn.classList.add("disabled")
			: this.refs.submitBtn.classList.remove("disabled");
	}

	onSubmit(event) {
		event.preventDefault();

		const {
			filterIncludeCategorySelect,
			filterIncludeValueSelect,
			filterExcludeCategorySelect,
			filterExcludeValueSelect,
			filterSortCategorySelect,
		} = event.currentTarget.elements;
		const categoryToSort = filterSortCategorySelect.value;
		const categoryToInclude = filterIncludeCategorySelect.value;
		const categoryToExclude = filterExcludeCategorySelect.value;
		const valueToInclude = this.parseValue(filterIncludeValueSelect.value);
		const valueToExclude = this.parseValue(filterExcludeValueSelect.value);

		const filteredItems = this.list
			.filter((item) => (categoryToInclude ? item[categoryToInclude] === valueToInclude : item))
			.filter((item) => (categoryToExclude ? item[categoryToExclude] !== valueToExclude : item));

		const sortedList = categoryToSort
			? [...filteredItems].sort((firstItem, secondItem) =>
					Number.isNaN(firstItem[categoryToSort])
						? firstItem[categoryToSort] - secondItem[categoryToSort]
						: firstItem[categoryToSort]
								.toString()
								.localeCompare(secondItem[categoryToSort].toString())
			  )
			: filteredItems;

		this.renderList(sortedList);
	}

	showFilterForm() {
		this.refs.filterModalEl.classList.toggle(App.CLOSE_FILTER_CLASS);

		if (!this.refs.filterModalEl.classList.contains(App.CLOSE_FILTER_CLASS)) {
			document.addEventListener("keydown", this.onCloseBtnPress.bind(this));
			document.addEventListener("click", this.clickOutsideFilterForm.bind(this));
		} else {
			document.removeEventListener("keydown", this.onCloseBtnPress.bind(this));
			document.removeEventListener("click", this.clickOutsideFilterForm.bind(this));
			this.clearFilter();
		}
	}

	clickOutsideFilterForm(event) {
		if (event.target.closest(".filter-wrap")) {
			return;
		}

		this.refs.filterModalEl.classList.add(App.CLOSE_FILTER_CLASS);
		document.removeEventListener("keydown", this.onCloseBtnPress.bind(this));
		document.removeEventListener("click", this.clickOutsideFilterForm.bind(this));
		this.clearFilter();
	}

	onCloseBtnPress(event) {
		if (event.code !== App.CLOSE_FILTER_BTN_CODE) {
			return;
		}

		this.refs.filterModalEl.classList.add(App.CLOSE_FILTER_CLASS);
		document.removeEventListener("keydown", this.onCloseBtnPress.bind(this));
		document.removeEventListener("click", this.clickOutsideFilterForm.bind(this));
		this.clearFilter();
	}

	clearFilter() {
		this.renderList();
		this.refs.selectElements.forEach((selectItem) => {
			selectItem.innerHTML = `<option value=""></option>`;
		});
		this.renderFilterCategories();
	}
}

new App();
