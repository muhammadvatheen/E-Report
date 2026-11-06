const getData = async () => {
    const Api1 = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";
    const Api2 = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
    try {

        // FETCH 2 API SEKALIGUS
        const [response1, response2] = await Promise.all([
            fetch(Api1),
            fetch(Api2)
        ]);

        // UBAH KEDUANYA MENJADI JSON
        const data1 = await response1.json();
        const data2 = await response2.json();

        innerHTML += `
        <div>
         <img src="${data1.events[0].competitions[0].thumbnail}" alt="Event Image">
        </div>
        `

        // TAMPILKAN HASIL
        console.log("DATA ESPN:", data1.events);
        console.log("DATA THESPORTSDB:", data2.teams);

    } catch (error) {
        console.log("Error:", error);
    }

};

getData(); 