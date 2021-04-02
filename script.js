// create Agora client
var client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
var localTracks = {
  videoTrack: null,
  audioTrack: null
};
var remoteUsers = {};
// Agora client options
var options = {
  appid: null,
  channel: null,
  uid: null,
//  token: null,
  role: "audience" // host or audience
};


/********* Select a Role *************/
$("#host-join").click(function (e) {
      options.role = "host"
      /***handle users to publish video and audio tracks to each other ***/
        client.on("user-published", handleUserPublished);
      /***End.handle users to publish video and audio tracks to each other ***/
})

$("#audience-join").click(function (e) {
  options.role = "audience"
})
/********* End. Select a Role *************/

$("#join-form").submit(async function (e) {
  e.preventDefault();
  $("#host-join").attr("disabled", true);
  $("#audience-join").attr("disabled", true);
  try {
    // send the app ID
    options.appid = "cc01b033d1624664a323afdeec402a87";//;$("#appid").val();
    options.channel = $("#channel").val();
    await join();

  } catch (error) {
    console.error(error);
  } finally {
    $("#leave").attr("disabled", false);
  }
})

$("#leave").click(function (e) {
  leave();
})

async function join() {
  // create Agora client
  client.setClientRole(options.role);

  if (options.role === "audience") {
    // add event listener to play remote tracks when remote user publishs.
    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
  }

  /// join the channel
    options.uid = await client.join(options.appid, options.channel, null);

  if (options.role === "host") {

    // create local video   and  audio tracks
    localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();

    // play the local video track
    localTracks.videoTrack.play("local-player");
    $("#local-player-name").text(`localTrack(${options.uid})`);

    // publish local tracks to channel
    await client.publish(Object.values(localTracks));

    console.log("publish success");
  }
}
/****Leave Stream**********/
async function leave() {
  for (trackName in localTracks) {
    var track = localTracks[trackName];
    if(track) {
      track.stop();
      track.close();
      localTracks[trackName] = undefined;
    }
  }

  // remove remote users and player views
  remoteUsers = {};
  $("#remote-playerlist").html("");

  // leave the channel
  await client.leave();

  $("#local-player-name").text("");
  $("#host-join").attr("disabled", false);
  $("#audience-join").attr("disabled", false);
  $("#leave").attr("disabled", true);
  console.log("client leaves channel success");
}

async function subscribe(user, mediaType) {

  const uid = user.uid;
  // subscribe to a remote user
  await client.subscribe(user, mediaType);
  console.log("subscribe success");
  if (mediaType === 'video') {
    const player = $(`
      <div id="player-wrapper-${uid}">
        <p class="player-name">remoteUser(${uid})</p>
        <div id="player-${uid}" class="player"></div>
      </div>
    `);
    $("#remote-playerlist").append(player);
    user.videoTrack.play(`player-${uid}`);
  }
  if (mediaType === 'audio') {
    user.audioTrack.play();
  }
}

function handleUserPublished(user, mediaType) {
  const id = user.uid;
  remoteUsers[id] = user;
  subscribe(user, mediaType);
}

function handleUserUnpublished(user) {
  const id = user.uid;
  delete remoteUsers[id];
  $(`#player-wrapper-${id}`).remove();
}
