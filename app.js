
var userId;
var prevUrls = [];
const searchUrl = "https://api.www.documentcloud.org/api/documents/search/";

function loadHash() {
  if (window.location.hash) {
    var state = JSON.parse(decodeURIComponent(window.location.hash.slice(1)));
    document.getElementById("query").value = state.query;
    document.getElementById("attrs").value = state.attrs.join(", ");
    document.getElementById("data").value = state.metadata.join(", ");
    document.getElementById("sort").value = state.sort;
    document.getElementById("group").checked = state.group;
    document.getElementById("notes").checked = state.notes;
  }
}

function getUserId() {
  const url = "https://api.www.documentcloud.org/api/users/me/";
  fetch(url, { credentials: "include"})
    .then((response) => {
      if (response.ok) {
        response.json().then((data) => {
          if (data) {
            document.getElementById("auth").innerHTML = "You are authenticated as " +
              data.username;
            userId = data.id;
            var query = `user:${userId}`;
            if (!document.getElementById("query").value) {
              document.getElementById("query").value = query;
            }
            update();

          }
        });
      } else {
        document.getElementById("auth").innerHTML = "You are not authenticated, <a href=\"https://www.documentcloud.org/\">please login</a>";
      }
    }).catch((err) => document.getElementById("auth").innerHTML =
    `Error: check your CORS settings: ${err}`);
}

function paginator(parent, data, url, attrs, metadata, group, notes) {
  var nav = document.createElement("div");
  parent.appendChild(nav);
  if (prevUrls.length > 0) {
    var a = document.createElement("a");
    a.addEventListener("click", (event) => {
      event.preventDefault();
      getDocuments(prevUrls.pop(), attrs, metadata, group, notes);
    });
    a.href = "#";
    a.innerHTML = "Prev";
    nav.appendChild(a);
  } else {
    nav.appendChild(document.createTextNode("Prev"));
  }
  nav.appendChild(document.createTextNode(" | "));
  if (data.next) {
    a = document.createElement("a");
    a.addEventListener("click", (event) => {
      event.preventDefault();
      prevUrls.push(url);
      getDocuments(data.next, attrs, metadata, group, notes);
    });
    a.href = "#";
    a.innerHTML = "Next";
    nav.appendChild(a);
  } else {
    nav.appendChild(document.createTextNode("Next"));
  }
  return nav;
}

function getDocuments(url, attrs, metadata, group, notes) {
  const documents = document.getElementById("documents");
  documents.innerHTML = "Loading...";
  fetch(url, { credentials: "include"})
    .then((response) => {
      if (response.ok) {
        response.json().then((data) => {
          documents.innerHTML = "";
          documents.appendChild(
            document.createTextNode(
              `There are ${data.count.toLocaleString("en-us")} documents`
            )
          );
          paginator(documents, data, url, attrs, metadata, group);
          documents.appendChild(document.createElement("hr"));
          data.results.forEach((item, index) => {
            if ((group && index === 0) ||
                (group && data.results[index - 1].data[group]?.[0] !== item.data[group]?.[0])
              ) {
              var header = document.createElement("h1");
              header.innerHTML = item.data[group]?.[0];
              documents.appendChild(header);
              documents.appendChild(document.createElement("hr"));
            }
            var docDiv = document.createElement("div");
            var docDl = document.createElement("dl");
            docDiv.appendChild(docDl);
            attrs.forEach((attr, i) => {
              var dt = document.createElement("dt");
              dt.innerHTML = attr;
              docDl.appendChild(dt);
              var dd = document.createElement("dd");
              if (i == 0) {
                  dd.innerHTML = `<a href="${item.canonical_url}" target="_blank">` +
                  `${item[attr]}</a>`;
              } else {
                dd.innerHTML = item[attr];
              }
              docDl.appendChild(dd);
            });
            metadata.forEach((datum) => {
              if (datum) {
                var dt = document.createElement("dt");
                dt.innerHTML = datum;
                docDl.appendChild(dt);
                var dd = document.createElement("dd");
                dd.innerHTML = item.data[datum];
                docDl.appendChild(dd);
              }
            });
            if (notes && item.notes.length > 0) {
              var dt = document.createElement("dt");
              dt.innerHTML = "Notes";
              docDl.appendChild(dt);
              var dd = document.createElement("dd");
              var ul = document.createElement("ul");
              dd.appendChild(ul);
              item.notes.forEach((note) => {
                var li = document.createElement("li");
                if (note.content) {
                  li.innerHTML = `${note.title} - ${note.content}`;
                } else {
                  li.innerHTML = note.title;
                }
                ul.appendChild(li);
              });
              docDl.appendChild(dd);
            }
            documents.appendChild(docDiv);
            documents.appendChild(document.createElement("hr"));
          });
          paginator(documents, data, url, attrs, metadata, group);
        });
      } else {
        documents.innerHTML = "Error";
      }
    }).catch((err) => documents.innerHTML = `Error: ${err}`);
}

function update() {
  var query = document.getElementById("query").value;
  var attrs = document.getElementById("attrs").value.split(",").map((i) => i.trim());
  var metadata = document.getElementById("data").value.split(",").map((i) => i.trim());
  var sort = document.getElementById("sort").value.trim();
  var group = document.getElementById("group").checked;
  var notes = document.getElementById("notes").checked;
  var state = {
    "query": query,
    "attrs": attrs,
    "metadata": metadata,
    "sort": sort,
    "group": group,
    "notes": notes,
  }
  window.location = "#" + encodeURIComponent(JSON.stringify(state));

  var dataUrl;
  if (sort) {
    dataUrl = `${searchUrl}?q=${query}&sort=data_${sort}`;
  } else {
    dataUrl = `${searchUrl}?q=${query}`;
  }
  if (group) {
    if (sort.startsWith("-")) {
      group = sort.slice(1);
    } else {
      group = sort;
    }
  }
  getDocuments(dataUrl, attrs, metadata, group, notes);
}

function tag() {
  var id = document.getElementById("tag_id").value;
  const url = `https://api.www.documentcloud.org/api/documents/${id}/data/test_key/`;
  const token = ('; '+document.cookie).split(`; csrftoken=`).pop().split(';')[0];
  fetch(url, {
    method: "PUT",
    credentials: "include",
    headers: {
      "X-CSRFToken": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({"values": ["test_value"]})
  }).then((response) => {
      if (response.ok) {
        document.getElementById("tag_txt").innerHTML = "it worked";
      } else {
        document.getElementById("tag_txt").innerHTML = "something went wrong";
      }
    }).catch((err) => document.getElementById("auth").innerHTML = "something went wrong");
}

document.getElementById("update").addEventListener("click", update);
document.getElementById("tag").addEventListener("click", tag);

loadHash();
getUserId();
