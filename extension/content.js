(function () {
  chrome.runtime.onMessage.addListener(function (msg, _, sendResponse) {
    if (!msg || !msg.type) {
      return;
    }

    switch (msg.type) {
      case 'fetchDiaryLogs':
        return sendResponse(fetchDiaryLogs());
      default:
        return;
    }

  });

  function fetchDiaryLogs() {
    const domQuery = '[ng-if="data && data.snapshots"]';

    const container = document.querySelectorAll(domQuery)[0];

    if (!container) {
      console.log("Container wasn't found!");
      return null;
    }

    const dataContainer = container.firstElementChild;

    let diaryLogs;

    switch (dataContainer.getAttribute('ng-switch-when')) {
      case 'list':
        diaryLogs = parseList(dataContainer);
        break;
      case 'grid':
        diaryLogs = parseGrid(dataContainer);
        break;
    }

    return formatLogData(diaryLogs);
  }

  function formatLogData(logData) {
    const data = [];
    for (const key in logData) {
      if (!Object.prototype.hasOwnProperty.call(logData, key)) {
        continue;
      }

      data.push({
        time: logData[key] * 10,
        memo: key
      });
    }

    return data;
  }

  function parseList(container) {
    const domQuery = '.o-memo-container span';
    const items = container.querySelectorAll(domQuery);

    const data = {};

    for (const item of items) {
      const text = item.textContent.trim();
      if (!data[text]) {
        data[text] = 0;
      }

      data[text]++;
    }

    return data;
  }

  function parseGrid(container) {
    const domQuery = '[headers="minutesData.headers"]';

    const rows = container.querySelectorAll(domQuery);

    const data = {};

    const countRegexp = /^col-md-(\d+)$/;

    for (const row of rows) {
      for (const item of row.childNodes) {
        if (item.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }

        const headers = item.querySelectorAll('.o-header');
        for (const header of headers) {
          const item = header.querySelector('.o-memo-container span');
          if (!item) {
            continue;
          }
          const text = item.textContent.trim();
          if (!data[text]) {
            data[text] = 0;
          }

          let count = 0;
          for (const className of header.classList) {
            const match = className.match(countRegexp);
            if (!match) {
              continue;
            }

            count = parseInt(match[1], 10) / 2;
            break;
          }

          data[text] += count;
        }

      }
    }

    return data;
  }
})();