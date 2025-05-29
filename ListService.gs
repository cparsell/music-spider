class ListService {
  constructor() {
    this.artists = null;
    this.events = null;
  }

  getArtists() {
    if (this.artists !== null) return this.artists;
    console.info("Artists List is null - getting");
    return this.buildArtistsList();
  }

  getEvents() {
    if (this.events !== null) return this.events;
    console.info("Events List is null - getting");
    return this.buildEventsList();
  }

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Build array of artists
   * Gets artist names from Artists (Spotify) sheet
   * and 'Artists (Custom)' sheet if searchManuallyAdded = TRUE
   * in the config.gs file
   * @returns {array} filtered array of artists
   */
  buildArtistsList() {
    let results = [];
    try {
      let artistRows = SHEETS.ARTISTS.getLastRow() - 1;
      if (artistRows == 0) artistRows = 1;
      const artistsArr = SHEETS.ARTISTS.getRange(
        2,
        1,
        artistRows,
        1
      ).getValues();

      for (let i = 0; i < artistsArr.length; i++) {
        results.push(artistsArr[i][0]);
      }
      // if searchManuallyAdded = TRUE, include artists in 'Artists (Custom)' sheet in the search
      if (Config.searchManuallyAdded()) {
        let customArtistRows = SHEETS.CUSTOM_ARTIST.getLastRow() - 1;
        let manualArtistsArr = SHEETS.CUSTOM_ARTIST.getRange(
          2,
          1,
          customArtistRows,
          1
        ).getValues();
        for (let i = 0; i < manualArtistsArr.length; i++) {
          results.push(manualArtistsArr[i][0]);
        }
      }

      // let filtered = artistsArr.filter(n => n); // removes blank strings
      let filtered = CommonLib.arrayRemoveDupes(results, true); // remove duplicates and blank strings
      this.artists = filtered;
      return filtered;
    } catch (err) {
      console.error(`buildArtistsList() error - ${err}`);
    }
  }

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Return Events from Events Sheet
   * @returns {array} array
   */
  buildEventsList() {
    try {
      const lastRow = SHEETS.EVENTS.getLastRow();
      let events = [];

      if (lastRow > 1) {
        for (let i = 1; i < lastRow; i++) {
          let rowData = CommonLib.getRowData(SHEETS.EVENTS, HEADERNAMES, i + 1);
          let { date } = rowData;
          date = new Date(date);
          let eventDate = Utilities.formatDate(date, "PST", "yyyy/MM/dd HH:mm");
          rowData.date = eventDate;
          events.push(rowData);
        }

        // Sort by key, which is the date
        const ordered = events.sort(function (a, b) {
          return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
        });
        this.events = ordered;
        return ordered;
      } else {
        console.warn("No events found- unable to build array of Events");
      }

      return [];
    } catch (err) {
      console.error(`buildEventsList() error - ${err}`);
    }
  }
}
