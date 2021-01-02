// URL for the Star Wars API
const SWAPI_BASE = "https://swapi.dev/api/";

// 1-9 in Roman Numerals. Easier than trying to
// convert them algorithmically.
const romanNumbers = [
  "",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX"
];

/**
 * Returns a new text node containing the supplied text.
 * @param {string} text
 * @returns {Text}
 */
function textNode(text) {
  return document.createTextNode(text);
}

/**
 * Returns a new HTMLElement of the associated tag. A
 * class name can be supplied with the tag (using a
 * dot and then class name, e.g., div.center).
 *
 * Any children passed are appended.
 *
 * @param {string} tagWithClassName
 * @param {HTMLElement[]} children
 * @returns {HTMLElement}
 */
function h(tagWithClassName, children) {
  // if no class name is provided, the tag will still
  // be present, but className will be undefined.
  const [tag, className] = tagWithClassName.split(".");

  // create the element from the tag
  const el = document.createElement(tag);

  // if className was provided, make sure the element
  // is given that class.
  if (className) {
    el.className = className;
  }

  // if there are children, make sure they get added
  // to the element.
  if (children) {
    if (Array.isArray(children)) {
      el.append(...children);
    } else {
      el.append(children);
    }
  }

  // return the new element.
  return el;
}

/**
 * Returns an HTMLOptionElement with the supplied
 * value and text content.
 * @param {string} value
 * @param {string} text
 * @returns {HTMLOptionElement}
 */
function option(value, text) {
  // create a new <option> element
  const el = h("option");

  // make sure the "value" is set
  el.setAttribute("value", value);

  // Set the text
  el.textContent = text;

  // return the option
  return el;
}

/**
 * Returns an array of Star Wars films, as retrieved
 * from the Star Wars API. There's a lot of data
 * returned here, but we're really only interested
 * in the title, episode ID, and the crawl text.
 *
 * @async
 * @returns {Promise<Array<{episode_id: number, title:string, opening_crawl: string}>}
 */
async function loadFilms() {
  try {
    // request the list of films using fetch
    // NOTE: "/" is important here, otherwise the endpoint
    // wants to redirect to http, which is then blocked.
    const res = await fetch(`${SWAPI_BASE}films/`);

    // Now that we have the response, get the JSON from it.
    const json = await res.json();

    // SWAPI includes the results in the object, and that's
    // what we're really interested in, so just return it.
    return json.results;
  } catch (err) {
    // Something went wrong (probably not online, or server is down)
    // so we'll return nothing. Normally you'd do some better error
    // handling here.
    return [];
  }
}

/**
 * Returns a specific Star Wars film given the `id`. The
 * `id` is based upon the release order (not the episode
 * order). So `1` returns Episode 4.
 *
 * @async
 * @param {number} id
 * @returns {{episode_id: number, title: string, opening_crawl: string}}
 */
async function loadFilm(id) {
  try {
    // get a _specific_ film, by ID
    const res = await fetch(`${SWAPI_BASE}films/${id}/`);
    const json = await res.json();
    return json;
  } catch (err) {
    // if the film doesn't exist, we'll just return an
    // an empty object. You should do better error handling.
    return {};
  }
}

/**
 * Loads and renders films into the "Film" drop down.
 */
async function renderFilms() {
  // get the films...
  const films = await loadFilms();

  // transform the films into a list of HTMLOptionElements
  const els = films.map((film, idx) => option(idx + 1, film.title));

  // append those options to our "Film" drop down.
  document.querySelector("#film").append(...els);
}

/**
 * Changes the crawl to the desired text. For the 3D
 * crawl, additional formatting is done, namely:
 *
 * - Centering the first two lines (episode # and title)
 * - Bolding the title (second line)
 *
 * @param {string} crawl
 */
function changeCrawl(crawl) {
  // update the film text textarea
  document.querySelector("#text").value = crawl;

  // find the element that's doing the 3D crawl
  const scrollText = document.querySelector("#scrollText");

  // clear it of any HTML elements
  scrollText.textContent = "";

  // split the crawl by DOUBLE NEW LINES (that is,
  // paragraphs are separated with a blank line.)
  const paragraphs = crawl.split("\n\n");

  // convert the paragraphs into HTMLElement nodes. The
  // first two will be centered, and the second one will
  // also be bold.
  const nodes = paragraphs.map((paragraph, idx) =>
    h(`p${idx < 2 ? ".center" : ""}`, [
      idx !== 1
        ? textNode(paragraph || " ")
        : h("strong", [textNode(paragraph)])
    ])
  );

  // add the nodes to the 3d Crawler
  scrollText.append(...nodes);

  // now, replace the 3D crawler to reset the animation.
  const cloneScroller = scrollText.cloneNode(true);
  scrollText.replaceWith(cloneScroller);
}

/**
 * Called when the "Film" dropdown has changed. Will load
 * the opening crawl for the selected film (or show an error
 * if something didn't work.)
 *
 * @async
 * @param {Event} evt
 */
async function filmChanged(evt) {
  // get the desired film
  const value = evt.target.value;

  // load it
  const data = await loadFilm(Number(value));

  // see if we get anything out of it -- opening crawl
  // should be defined. We split the crawl by \r\n and
  // rebuild it with \n, because the Star Wars API
  // returns \r\n, which will break our split later
  // (we use \n\n).
  if (data.opening_crawl) {
    changeCrawl(`EPISODE ${romanNumbers[data.episode_id] || data.episode_id}

${data.title}

${data.opening_crawl.split("\r\n").join("\n")}
`);
  } else {
    // no data, so give something useful
    changeCrawl(`EPISODE 0

Your Title Here

Couldn't get any words, so write
your own here!
`);
  }
}

/**
 * Called when the text is changed in the Crawl's text editor
 * (but only when the user changes it, not when we load it from
 * the Star Wars API!)
 * @param {Event} evt
 */
function crawlChanged(evt) {
  const newCrawl = evt.target.value;
  changeCrawl(newCrawl);
}

// get and render the films into the "Film" select box.
renderFilms();

// listen for changes to the "Film" dropdown so we can load the associated crawl.
document.querySelector("#film").addEventListener("change", filmChanged);

// listen for changes on the "Text" text area so we can update the crawl if the
// user types some new text in
document.querySelector("#text").addEventListener("input", crawlChanged);

// Provide a default crawl to start.
changeCrawl(`EPISODE I

A Star Wars Story

Lorem ipsum dolor sit amet, 
consectetur adipiscing elit. 
Phasellus vestibulum arcu eu
euismod condimentum. Duis
dignissim elementum leo quis 
vulputate. 

Cras id magna nulla. Fusce 
libero tortor, eleifend vel 
turpis sed, pellentesque 
ultrices eros. Curabitur viverra
semper risus, at porta ipsum.

Aenean sit amet eros sit amet 
tortor semper mattis. Maecenas
accumsan leo vel neque auctor,
non ultricies mi bibendum. 
`);
