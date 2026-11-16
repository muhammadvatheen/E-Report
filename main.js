const API = "https://api.coinpaprika.com/v1";

let allCoins = [];
let btcChart = null;
let btcSeries = null;

let btcCandles = [];

function toCandle(k) {
    return {
        time: Math.floor(k[0] / 1000) - new Date().getTimezoneOffset() * 60,
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4])
    };
}

function updateBitcoinChart() {
    if (btcCandles.length === 0) {
        document.getElementById("chartMessage").textContent =
            "Data harga Bitcoin belum tersedia.";
        return;
    }

    if (!btcChart) {
        btcChart = LightweightCharts.createChart(
            document.getElementById("btcChart"),
            {
                autoSize: true,
                layout: {
                    background: { type: "solid", color: "transparent" },
                    textColor: "#8995aa"
                },
                grid: {
                    vertLines: { visible: false },
                    horzLines: { color: "rgba(255,255,255,0.06)" }
                },
                rightPriceScale: { borderColor: "rgba(255,255,255,0.1)" },
                timeScale: {
                    borderColor: "rgba(255,255,255,0.1)",
                    timeVisible: true,
                    secondsVisible: false
                }
            }
        );

        btcSeries = btcChart.addCandlestickSeries({
            upColor: "#19c98b",
            downColor: "#ff657a",
            borderVisible: false,
            wickUpColor: "#19c98b",
            wickDownColor: "#ff657a"
        });

        btcSeries.setData(btcCandles);
        btcChart.timeScale().fitContent();
    }

    document.getElementById("chartMessage").textContent =
        "Last price update: " + new Date().toLocaleTimeString("id-ID");
}

// Format harga USD
function formatPrice(price) {
    if (price === null || price === undefined) return "N/A";

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: price < 1 ? 8 : 2
    }).format(price);
}

// Format angka besar
function formatNumber(number) {
    if (number === null || number === undefined) return "N/A";

    return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 2
    }).format(number);
}

// Format persentase
function formatChange(change) {
    if (change === null || change === undefined) return "N/A";

    const sign = change > 0 ? "+" : "";

    return `${sign}${change.toFixed(2)}%`;
}

// Mengambil data cryptocurrency
async function getCrypto() {
    const table = document.getElementById("coinTable");

    try {
        table.innerHTML = `
            <tr>
                <td colspan="6" class="loading">
                    Mengambil data cryptocurrency...
                </td>
            </tr>
        `;

        const response = await fetch(`${API}/tickers`);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();

        allCoins = data;

        showStatistics();
        applyFilters();
        showTopMovers();
        updateBitcoinChart();

        console.log("Data berhasil diambil:", allCoins.length);

        document.getElementById("lastUpdated").textContent =
            "Last fetched: " +
            new Date().toLocaleTimeString("id-ID");

    } catch (error) {
        console.error("Gagal mengambil data:", error);

        table.innerHTML = `
            <tr>
                <td colspan="6" class="error">
                    Gagal mengambil data. Periksa koneksi internet.
                </td>
            </tr>
        `;

        document.getElementById("coinCount").textContent = "Error";
    }
}

// Menampilkan statistik
function showStatistics() {
    const btc = allCoins.find(coin => coin.id === "btc-bitcoin");
    const eth = allCoins.find(coin => coin.id === "eth-ethereum");
    const sol = allCoins.find(coin => coin.id === "sol-solana");

    showCoinStat(btc, "btcPrice", "btcChange");
    showCoinStat(eth, "ethPrice", "ethChange");
    showCoinStat(sol, "solPrice", "solChange");

    document.getElementById("coinCount").textContent =
        allCoins.length.toLocaleString("en-US");
}

function showCoinStat(coin, priceId, changeId) {
    const priceElement = document.getElementById(priceId);
    const changeElement = document.getElementById(changeId);

    if (!coin || !coin.quotes?.USD) {
        priceElement.textContent = "N/A";
        changeElement.textContent = "Data unavailable";
        return;
    }

    const quote = coin.quotes.USD;
    const change = quote.percent_change_24h;

    priceElement.textContent = formatPrice(quote.price);

    changeElement.textContent =
        formatChange(change) + " (24h)";

    changeElement.className =
        "change " + (change >= 0 ? "positive" : "negative");
}

// Menampilkan tabel cryptocurrency
function showCoins(coins) {
    const table = document.getElementById("coinTable");

    const visibleCoins = coins.slice(0, 100);

    if (visibleCoins.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="6" class="loading">
                    Cryptocurrency tidak ditemukan.
                </td>
            </tr>
        `;

        document.getElementById("resultCount").textContent =
            "0 results";

        return;
    }

    table.innerHTML = visibleCoins.map(coin => {
        const quote = coin.quotes?.USD || {};
        const change = quote.percent_change_24h;

        const changeClass =
            change >= 0 ? "positive" : "negative";

        return `
            <tr>
                <td>${coin.rank || "-"}</td>

                <td>
                    <div class="coin-info">
                        <div class="coin-symbol">
                            <img
                                src="https://static.coinpaprika.com/coin/${coin.id}/logo.png"
                                alt="${coin.symbol}"
                                loading="lazy"
                                onerror="this.parentElement.textContent = this.alt"
                            >
                        </div>

                        <div>
                            <strong>${coin.name}</strong>
                            <small>${coin.symbol}</small>
                        </div>
                    </div>
                </td>

                <td>${formatPrice(quote.price)}</td>

                <td class="${changeClass}">
                    ${formatChange(change)}
                </td>

                <td>$${formatNumber(quote.market_cap)}</td>

                <td>$${formatNumber(quote.volume_24h)}</td>
            </tr>
        `;
    }).join("");

    document.getElementById("resultCount").textContent =
        `Showing ${visibleCoins.length} of ${coins.length} results`;
}

// Search dan sorting
function applyFilters() {
    const keyword = document
        .getElementById("searchInput")
        .value.toLowerCase();

    const sortValue =
        document.getElementById("sortSelect").value;

    let filtered = allCoins.filter(coin =>
        coin.name.toLowerCase().includes(keyword) ||
        coin.symbol.toLowerCase().includes(keyword)
    );

    if (sortValue === "rank") {
        filtered.sort((a, b) => a.rank - b.rank);
    }

    if (sortValue === "price") {
        filtered.sort((a, b) =>
            (b.quotes.USD.price || 0) -
            (a.quotes.USD.price || 0)
        );
    }

    if (sortValue === "change") {
        filtered.sort((a, b) =>
            (b.quotes.USD.percent_change_24h || 0) -
            (a.quotes.USD.percent_change_24h || 0)
        );
    }

    if (sortValue === "volume") {
        filtered.sort((a, b) =>
            (b.quotes.USD.volume_24h || 0) -
            (a.quotes.USD.volume_24h || 0)
        );
    }

    showCoins(filtered);
}

document.getElementById("searchInput").addEventListener(
    "input",
    applyFilters
);

document.getElementById("sortSelect").addEventListener(
    "change",
    applyFilters
);

// Menampilkan top movers
function showTopMovers() {
    const container = document.getElementById("topMovers");

    const movers = [...allCoins]
        .filter(coin =>
            Number.isFinite(coin.quotes?.USD?.percent_change_24h)
        )
        .sort((a, b) =>
            b.quotes.USD.percent_change_24h -
            a.quotes.USD.percent_change_24h
        )
        .slice(0, 5);

    container.innerHTML = movers.map(coin => {
        const change = coin.quotes.USD.percent_change_24h;

        return `
            <div class="mover">
                <div class="mover-name">
                    <strong>${coin.name}</strong>
                    <small>${coin.symbol} · Rank #${coin.rank}</small>
                </div>

                <span class="mover-change positive">
                    ${formatChange(change)}
                </span>
            </div>
        `;
    }).join("");
}

// Isi grafik awal dengan 60 candle terakhir (1 menit)
async function loadBtcHistory() {
    try {
        const res = await fetch(
            "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=60"
        );
        const data = await res.json();

        btcCandles = data.map(toCandle);
    } catch (e) {
        console.error("Gagal load history BTC:", e);
    }
}

// Update harga BTC realtime
async function updateBtcLive() {
    try {
        const [tickerRes, klineRes] = await Promise.all([
            fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"),
            fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=1")
        ]);
        const d = await tickerRes.json();
        const klines = await klineRes.json();
        const price = parseFloat(d.lastPrice);
        const change = parseFloat(d.priceChangePercent);

        document.getElementById("btcPrice").textContent = formatPrice(price);
        const el = document.getElementById("btcChange");
        el.textContent = formatChange(change) + " (24h)";
        el.className = "change " + (change >= 0 ? "positive" : "negative");

        const candles = klines.map(toCandle);
        if (btcSeries) {
            candles.forEach(c => btcSeries.update(c));
        } else {
            btcCandles = candles;
        }

        updateBitcoinChart();
    } catch (e) {
        console.error("Live BTC error:", e);
    }
}

// Tombol refresh
document.getElementById("refreshBtn").addEventListener(
    "click",
    async function () {
        this.disabled = true;
        this.textContent = "Loading...";

        try {
            await getCrypto();
            await updateBtcLive();
        } finally {
            this.disabled = false;
            this.textContent = "↻ Refresh";
        }
    }
);

// Menjalankan dashboard
(async () => {
    await loadBtcHistory();
    await getCrypto();
    setInterval(updateBtcLive, 2 * 1000);
    setInterval(getCrypto, 5 * 60 * 1000);
})();