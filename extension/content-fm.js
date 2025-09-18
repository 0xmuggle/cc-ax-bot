class TwitterMonitor {
  constructor() {
    const stored = localStorage.getItem('cbot.coinMap') || "[]";
    this.processedTweets = new Set(JSON.parse(stored));
    this.init();
  }

  async subscribe() {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const d = document.querySelector("#__next button[data-guide='listen-button']");
    if (d && (d.textContent === "收听")) {
      d.click();
    }
    
    const d2 = document.querySelector("#__next div.css-1hohgv6 > div > button");
    if(d2 && d2.innerText === '已断开') {
      d2.click();
    }
  }

  async init() {
    setInterval(() => {
      localStorage.setItem('cbot.coinMap', JSON.stringify([...this.processedTweets].reverse().slice(0, 100)));
    }, 60 * 1000);

    setInterval(() => {
      window?.location?.reload();
    }, 10 * 60 * 1000);

    setInterval(() => {
      this.subscribe();
    }, 2000);

    while (true) {
      await this.calcCoinMap();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  async calcCoinMap() {
    const divs = document.querySelectorAll("#__next div[role='row'] > div");
    divs.forEach(div => {
      const group = div.querySelector("div[role='group'] > div > div:nth-child(2)");
      if (group) {
        const name = div.querySelector("div[role='group'] > div > div:nth-child(1)").textContent;
        const type = group.querySelector(":scope > div:nth-child(1) > div:nth-child(1) p:last-child")?.textContent;
        const token = group.querySelector(":scope > div:nth-child(1) > div:nth-child(2) a");
        const count = group.querySelector(":scope > div:nth-child(1) > div:nth-child(2) span")?.textContent || 0;
        const tokenAddress = token?.getAttribute("href")?.split("token/solana/")[1];
        const tokenName = token?.textContent;
        const marketCap = Number((group.querySelector(":scope > div:nth-child(2) > div > div p:last-child")?.textContent || '').replace("k", "").replace("$", ""));
        const amount = Number((group.querySelector(":scope > div:nth-child(3) > div > div p:last-child")?.textContent || '0'));
        let time = div.querySelector("div[role='group'] > div > div:nth-child(3)")?.textContent;
        if (!time.includes("分钟") && !Number.isNaN(marketCap) && marketCap > 0 && type === "买入" && amount > 0.5) {
          if (!this.processedTweets.has(tokenAddress)) {
            this.processedTweets.add(tokenAddress);
            console.log("ms", type, tokenName, marketCap, tokenAddress, count, time, time.replace('秒前', '') * 1000);
            time = new Date(new Date().getTime() + time.replace('秒前', '') * 1000).toLocaleString();
            if (window.opener) {
              window.opener.postMessage({
                type: "FROM_FM_EXTENSION",
                payload: {
                  name,
                  type,
                  tokenName,
                  tokenAddress,
                  marketCap,
                  count,
                  time,
                  amount,
                }
              }, "*");
            }
          };
        }
      }
    });
  }
}

// 初始化监控器
new TwitterMonitor();