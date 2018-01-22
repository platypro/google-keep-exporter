var cheerio = require('cheerio');
var turndown = require('turndown');
var moment = require('moment');


function getImages(node) {
    var images = [];
    if (node instanceof Array) {
        node.forEach(child => {
            images = images.concat(getImages(child));
        });
        return images;
    }

    if (node.name == 'img') {
        var img = node.attribs.src;
        images.push(img);
        return images;
    }

    if (!node.children)
        return [];

    node.children.forEach(child => {
        images = images.concat(getImages(child));
    });
    return images;
}

function parse(data) {
	var $ = cheerio.load(data);

	var note = {};
	note.content = $(".content").html();

    var turndownService = new turndown({defaultReplacement: function (content, node) { return content + '  \n' }})
    turndownService.remove(function(node, opts) {
          return(node.getAttribute('class') === 'bullet');
        });
    turndownService.addRule('Check', {
      filter: function(node, opts)
        {
          return(node.getAttribute('class') === 'listitem checked');
        },
      replacement: function (content) 
        {
          return '[X] - ' + content
        }
    })

    turndownService.addRule('unCheck', {
      filter: function(node, opts)
        {
          return(node.getAttribute('class') === 'listitem');
        },
      replacement: function (content) 
        {
          return '[ ] - ' + content
        }
    })

    note.content = turndownService.turndown(note.content)

	// FIXME: What about timezone?
	note.date = $(".heading").text().trim();
	note.date = moment(note.date).toISOString();

	note.title = $(".title").text().trim();
	note.archived = $.contains(".archived");

	note.tags = $("span.label").toArray();
	note.tags = note.tags.map(function(elem) {
		if (!elem.children) {
			return null;
		}
		return elem.children[0].data;
	});

    var attachments = $("div.attachments").toArray();
    note.attachments = getImages(attachments);

	return note;
}

module.exports = parse;
