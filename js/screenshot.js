/**
 * Screenshot Capture
 */
let slack_endpoint =  'https://hooks.slack.com/services/<YOURENDPOINT>';
const tool_download_link = 'https://chrome.google.com/webstore/<YOUR_APP_DOWNLOAD_LINK>';
const imageHostDomain = "https://NODE_OR_PHP_HOST";
let image_post_endpoint = `${imageHostDomain}/slackpost.php`;

let random_file_number = Math.floor(Math.random() * (200 - 100)) + 100;

const getSlackEndPoints = (channel_name = 'nos_channel') => {
  switch (channel_name) {
    case "my_channel":
      return "xdsfdasfasdfsadfsdafsadfdasfsadfsadfasf";
      break;
    default:
      alert(
        "There was an error while processing your request. Error Code: Bad Slack API Key"
      );
      return;
  }
}

// Convert a regular image to base64.
const getBase64Image = (img) => {
  var canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  var dataURL = canvas.toDataURL("image/png");
  return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}

// Converts canvas to an image
const convertCanvasToImage = (canvas) => {
  var image = new Image();
  image.src = canvas.toDataURL("image/png");
  return image;
}

/**
 * Send msg to slack.
 * @param {*} url 
 * @param {*} tab 
 * @param {*} msg 
 * @param {*} rockToolErroTrap 
 * @param {*} base64 
 */
const send_to_nos = (url, tab, msg, rockToolErroTrap, base64) => {
  let rock_tool_user = 'APP User'
  let get_selected_slack_inp = getSlackEndPoints($('#sky_tools_select_slack').val());
  slack_endpoint = `https://hooks.slack.com/services/${get_selected_slack_inp}`;
  
    chrome.storage.sync.get(['sky_tool_user'], function(result) {
      let randomQueryNo = Math.floor(Math.random() * 1000);
      let nosReporter = $('#sky_reporter').val();
      let slackMsgTitle = $('#sky_tools_select_slack option:selected').text() || 'MY APP';
      rock_tool_user = (nosReporter) ? nosReporter : result.sky_tool_user;
      chrome.storage.sync.set({sky_tool_user: nosReporter}, function() {
      });

      // TO-DO PROMISIFY this.
      let custom_msg = $('#sky_tools_message_input').val();
      rock_tool_user = rock_tool_user.replace(/@/g, "");

      // Remove JSON unfriendly chars.
      custom_msg = custom_msg.replace(/\"/g, "");
      custom_msg = custom_msg.replace(/\\/g, "");

      let slackMSG = `{
        "attachments": [
            {
                "title": "${slackMsgTitle} Reporting Tool",
                "title_link": "${tool_download_link}",
                "author_name": "<@${rock_tool_user}>",
                "text": " ${custom_msg} \n ${rockToolErroTrap}",
                "image_url": "${imageHostDomain}/${random_file_number}slackimage.png?x=${randomQueryNo}",
                "color": "#764FA5",
                "actions": [
                  {
                    "type": "button",
                    "text": "Go to URL",
                    "url": "${msg.url}"
                  }
                ]
            }
        ]
      }`;

      const url = image_post_endpoint
      $.ajax({
        url: url,
        type: 'POST',
        data: { image_data : base64, file_name: random_file_number },
        beforeSend: function( xhr ) {
        }
      })
        .done(function( data ) {
          const slackURL = slack_endpoint;
          $.ajax({
              data: slackMSG,
              'Content-type': ' application/json',
              processData: false,
              type: 'POST',
              url: slackURL
          }).done(function( data ) {
            window.close();
          }); 
        });
    });  
}

// Store Slack user_id for auto populate.
chrome.storage.sync.get(['sky_tool_user'], function(result) {
  $('#sky_reporter').val(result.rock_tool_user);
});

// Helper function to capture annotation and screenshot on canvas.
function setScreenshotUrl(url, tab, msg, rockToolErroTrap) {
  $("#sky_button_submit").click(function() {
    jQuery('#sky_button_submit').text('Please Wait...');
    var element = $("#myCanvas"); // global variable
    var getCanvas; // global variable
    html2canvas(element, {
     onrendered: function (canvas) {
      getCanvas = canvas;
      var imgageData = getCanvas.toDataURL("image/png");
      var base64 = imgageData.replace(/^data:image\/(png|jpg);base64,/, "");
      send_to_nos(url, tab, msg, rockToolErroTrap, base64);
      }
    });
  });

  $('#myCanvas').annotate({
    color: 'red',
    linewidth:10,
    fontsize:"20px",
    bootstrap: true,
    images: [url],
    type : "arrow"
  });

}
