(function () {
  const cTabs = chrome.tabs;

  /**
   * Get the current URL.
   *
   * @param {function(string)} callback called when the URL of the current tab
   *   is found.
   */
  function getCurrentTabUrl(callback) {
    const queryInfo = {
      active: true,
      currentWindow: true
    };

    cTabs.query(queryInfo, (tabs) => callback(tabs[0]));
  }

  function minutesToTime(minutes) {
    const formattedHours = Math.floor(minutes / 60);
    const formattedMinutes = minutes % 60;

    let output = [];

    if (formattedHours > 0) {
      output.push(formattedHours + 'h');
    }

    if (formattedMinutes > 0) {
      output.push(formattedMinutes + 'm');
    }

    return output.join(' ');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const viewContainer = document.getElementById('container');
    const copyBtn = document.getElementById('copy-btn');

    const timeLogsView = new TimeLogsView(viewContainer);

    viewContainer.oncopy = function (event) {
      event.clipboardData.setData('text/plain', timeLogsView.generateTextForCopying());
      event.preventDefault();
    };

    copyBtn.addEventListener("click", () => {
      const el = document.createElement('textarea');
      el.style.position = 'absolute';
      el.style.left = '-100%';
      el.value = timeLogsView.generateTextForCopying();

      document.body.appendChild(el);
      el.select();
      document.execCommand("Copy");
      document.body.removeChild(el);
    }, false);

    copyBtn.style.visibility = 'hidden';

    getCurrentTabUrl((tab) => {
      cTabs.sendMessage(tab.id, { type: 'fetchDiaryLogs' }, (data) => {
        if (data) {
          copyBtn.style.visibility = 'initial';
        } else {
          copyBtn.style.visibility = 'hidden';
        }
        timeLogsView.setData(data);
      });
    });
  });

  class TimeLogsView {
    constructor(rootView) {
      this.rootView = rootView;
      this.excludedLogs = [];
      this.data = null;
      this.notExcludedTime = 0;
    }

    clear() {
      let child;
      while (child = this.rootView.lastChild) {
        this.rootView.removeChild(child);
      }
    }

    setData(data) {
      this.data = data;

      this.render();
    }

    render() {
      this.clear();

      this.notExcludedTime = 0;

      if (!this.data) {
        this.addTitleToContainer('No data for this date!');
        return;
      }

      this.addLogList();
      this.addTimeInfo();
    }

    addTimeInfo() {
      const el = document.createElement('p');
      el.classList.add('time-info');

      el.textContent = 'Total: ' + minutesToTime(this.notExcludedTime);

      this.rootView.appendChild(el);
    }

    addLogList() {
      const el = document.createElement('ul');
      el.classList.add('logs-list');

      this.data.forEach((logItem, index) => el.appendChild(this.createListItem(logItem, index)));

      this.rootView.appendChild(el);
    }

    createListItem(logItem, index) {
      const li = document.createElement('li');
      li.classList.add('item');

      const checkboxContainer = document.createElement('span');
      checkboxContainer.classList.add('checkbox-container');

      const checkbox = document.createElement('input');
      checkbox.setAttribute("type", "checkbox");
      checkbox.checked = true;

      checkbox.addEventListener('change', () => {
        this.toggleExcludeLog(index);
        this.render();
      });

      checkboxContainer.appendChild(checkbox);

      const memoContainer = document.createElement('span');
      memoContainer.textContent = this.generateTextForItem(logItem);
      memoContainer.classList.add('memo-container');

      li.appendChild(checkboxContainer);
      li.appendChild(memoContainer);

      if (this.isItemExcluded(index)) {
        checkbox.checked = false;
        li.classList.add('excluded');
      } else {
        this.notExcludedTime += logItem.time;
      }

      return li;
    }

    addTitleToContainer(title) {
      const el = document.createElement('h2');
      el.textContent = title;
      this.rootView.appendChild(el);
    }

    isItemExcluded(logNum) {
      return this.excludedLogs.indexOf(logNum) !== -1;
    }

    toggleExcludeLog(logNum) {
      const index = this.excludedLogs.indexOf(logNum);
      if (index >= 0) {
        this.excludedLogs.splice(index, 1);
      } else {
        this.excludedLogs.push(logNum);
      }
    }

    generateTextForItem(logItem) {
      return minutesToTime(logItem.time) + "\t-\t" + logItem.memo;
    }

    generateTextForCopying() {
      if (!this.data) {
        return '';
      }

      return this.data.filter((_, i) => !this.isItemExcluded(i)).map(this.generateTextForItem).join("\n");
    }
  }
})();