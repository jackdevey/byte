//Dotenv library
require('dotenv').config();

//Import request library
const request = require('request');

//Get setting variables
const server = process.env.SERVER;
const name = process.env.NAME;
const pfp = process.env.PFP;
const color = process.env.COLOR;

//The class that will be accessed by index.js
module.exports = class Music{

    //When the user wants to play a song
    async play(message, args, player, discord){
        //Join the arguments into a string
        args = args.join(" ")

        //If its a yt music link, convert to normal yt
        if(args.startsWith("https://music.youtube")){
            args = args.replace("music.", "")
        } 
        
        //If a song is currently playing
        if(player.isPlaying(message.guild.id)){
            //Add the song to the queue
            let song = await player.addToQueue(message.guild.id, args);
            song = song.song;
            //Tell the user the song has been added to the queue
            message.channel.send(`Song ${song.name} was added to the queue:`);
            this.showEmbed(song, message.author, discord, message)
        } else {
            //Else, play the song
            let song = await player.play(message.member.voice.channel, args);
            song = song.song;
            //Tell the user the song is now playing
            message.channel.send(`Started playing ${song.name}:`);
            this.showEmbed(song, message.author, discord, message)
        }
    }

    //When the user wants to skip a song
    async skip(message, player) {
        //Skip the song
        let song = await player.skip(message.guild.id);
        //Alert the user the song has been skipped
        message.channel.send(`${song.name} was skipped!`);
    }

    //When the user wants to clear the queue
    clear(message, player) {
        //Clear the queue
        player.stop(message.guild.id);
        //Alert the user the queue has been cleared
        message.channel.send('Music stopped, the Queue was cleared!');
    }

    //When the user wants to shuffle the queue
    shuffle(message, player) {
        //Shuffle the queue
        player.shuffle(message.guild.id);
        //Alert the user the queue has been shuffled
        message.channel.send('Server Queue was shuffled.');
    }

    //When the user wants to list the queue
    async queue(message, player) {
        //Get the queue
        let queue = await player.getQueue(message.guild.id);
        //Loop through it and alert the user
        message.channel.send('Queue:\n'+(queue.songs.map((song, i) => {
            return `${i === 0 ? 'Now Playing' : `#${i+1}`} - ${song.name} | ${song.author}`
        }).join('\n')), { split: true });
    }

    //When the user wants to loop a song
    loop(message, player) {
        //Find if it has been looped already
        let toggle = player.toggleLoop(message.guild.id);
        //Turn loop on
        if (toggle) message.channel.send('I will now repeat the current playing song.');
        //Turn loop off
        else message.channel.send('I will not longer repeat the current playing song.');
    }

    //When the user pauses a song
    async pause(message, player) {
        //Pause the song
        let song = await player.pause(message.guild.id);
        //Alert the user
        message.channel.send(`${song.name} was paused!`);
    }

    //When the user resumes a song
    async resume(message, player) {
        //Pause the song
        let song = await player.resume(message.guild.id);
        //Alert the user
        message.channel.send(`${song.name} was paused!`);
    }

    //When the user wants a progress bar
    progress(message, player) {
        //Create the bar
        let progressBar = player.createProgressBar(message.guild.id, 20);
        //Send it to the user
        message.channel.send(progressBar);
    }

    //When the user wants to queue a whole playlist
    async playlist(message, args, player, discord, server) {
        //Join the arguments into a string
        args = args.join(" ")

        //If its a yt music link, convert to normal yt
        if(args.startsWith("https://music.youtube")){
            args = args.replace("music.", "")
        } 

        //If the song is playing now
        let isPlaying = player.isPlaying(message.guild.id);
        //If MaxSongs is -1, will be infinite.
        let playlist = await player.playlist(message.guild.id, args, message.member.voice.channel, -1, message.author.tag);

        //Determine the Song (only if the music was not playing previously)
        let song = playlist.song;
        //Get the Playlist
        playlist = playlist.playlist;

        //Send information about adding the Playlist to the Queue
        message.channel.send(`Added ${playlist.name} to the queue`)
        this.showEmbedPL(playlist, message.author, discord, message)

        //If there was no songs previously playing, send a message about playing one.
        if (!isPlaying) {
            message.channel.send(`Started playing ${song.name}`);
            this.showEmbed(song, message.author, discord, message)
        }
    }

    //Show embeds for a song
    showEmbed(song, user, discord, message) {
        let guild = message.guild;
        let member = guild.member(message.author);
        let nickname = member ? member.displayName : null;
        const embed = new discord.MessageEmbed()
            .setColor(color)
            .setTitle(song.name)
            .setURL(song.url)
            .setAuthor(nickname, user.displayAvatarURL())
            .setDescription(song.author)
            .setThumbnail(song.thumbnail)
            .addField('Duration', song.duration, true)
            .setFooter('Playing on '+name+', ' + server, pfp);
        message.channel.send(embed);
    }

    //Show the user embeds for a playlist
    showEmbedPL(playlist, user, discord, message) {
        let guild = message.guild;
        let member = guild.member(message.author);
        let nickname = member ? member.displayName : null;
        const embed = new discord.MessageEmbed()
            .setColor(color)
            .setTitle(playlist.name)
            .setURL(playlist.url)
            .setAuthor(nickname, user.displayAvatarURL())
            .setDescription(playlist.author)
            .addField('Video Count', playlist.videoCount, true)
            .setFooter('Playing on '+name+', ' + server, pfp);
        message.channel.send(embed);
    }

    byteplTest(message, discord, args, player) {
        request('https://computub.com/byte/api/get_playlist?extID=' + args.join(" "), (err, res, body) => {
            if (err) { return console.log(err); }
            var songs = body.split(",");
            for(const song2 in songs) {
                this.play(message, [songs[song2]], player, discord);
            }
    });
    }
}
