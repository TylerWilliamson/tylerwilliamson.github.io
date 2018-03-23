//Feel free to copy this code, but you will need to change these variables.
var client = {
	clientId: 'wsB9sKF8OytRmQ',
	clientSecret: 'B_XQxtyD4328ePMw4Vir2QAjrKk',
	url: 'https://tylerwilliamson.github.io/yarr'
};

class yarrsnoowrap extends snoowrap {
  rawRequest(options) {
	return super.rawRequest(options)
				.then(
					response => {
						this.raw = JSON.stringify(response);
						
						return response;
					})
				.catch(
					response => {
						util.snackbar('Error!');
					}
				);
  }
}

var yarr = {
	snoowrap: {},
	subreddit: null,
	submission: null,
	load_subreddit: function (name='', sort='hot') {
		this.subreddit = this.snoowrap._getSortedFrontpage(sort,name);
		this.subreddit._fetch = null;
		this.subreddit.isFetching = true;

		return this.subreddit.then(
			posts => {
				$('.links-container').html('');
				
				posts.forEach(
					post => { 
						$('.links-container').append(tmpl('tmpl-link',post));
				}); 
				
				$('.links-container').scrollTop(0);
		}).then(() => {
			yarr.do_color();
			$('.subreddit').closest('.subreddit-container').removeClass('selected');
			$('.subreddit[data-link-subreddit="'+name+'"]').closest('.subreddit-container').addClass('selected');
			this.subreddit.isFetching = false;
		});
	},
	more_subreddit: function () {
		if (!this.subreddit.isFetching) {
			this.subreddit.isFetching = true;
			
			this.subreddit.fetchMore(
				{amount: 20, 
				 append: false})
				.then(
					posts => {
						posts.forEach(
							post => { 
								$('.links-container').append(tmpl('tmpl-link',post));
						}); 
			}).then(() => {
				yarr.do_color();
				this.subreddit.isFetching = false;
			});
		}
	},
	save: function (content,container) {
		if (container.is('.saved'))
			content.unsave()
				.then(() => {
					container.removeClass('saved');
					util.snackbar('Unsaved!');
				});
		else
			content.save()
				.then(() => {
					container.addClass('saved');
					util.snackbar('Saved!');
				});
	},
	share: function (submission,container,link) {
		if (link)
			util.copytoclipboard(container.attr('data-link-url'));
		else
			util.copytoclipboard(container.attr('data-link-permalink'));
	},
	gild: function (content,container) {
		content
			.gild()
			.then(() => {
				var gilds = container.find('.gilds');
				
				gilds.attr('data-gilds',Number(gilds.attr('data-gilds'))+1);
				gilds.text(tmpl.gilded(gilds.attr('data-gilds')));
				container.addClass('gilded')
				
				util.snackbar('Gilded! <span class=\'gilded\'><span class=\'gilds\'></span></span>');
			});
	},
	report: function (submission) {
		util.modalprompt('New Report','','Report Reason',{
							report:function () { 
								submission
									.report({reason: $('.modalprompt input').val()})
									.then(() => {
										util.modalpromptdismiss();
										util.snackbar('Reported!');
									});
						}});
	},
	load_submission: function (id) {
		this.snoowrap.getSubmission(id).fetch()
			.then(() => { 
				$('.comments-container')
					.attr('data-link-id','t3_'+id)
					.html('');
			
				this.submission = JSON.parse(this.snoowrap.raw);
				
				$('.title-container').html(tmpl('tmpl-title',this.submission.body[0].data.children[0].data));
				
				var last;
				if (this.submission.body[1].data.children.last().kind == 'more')
					last = this.submission.body[1].data.children.pop();
				
				this.submission.body[1].data.children.forEach(
					comment => {
						$('.comments-container').append($(tmpl('tmpl-comment',comment)).fixlinks());
					});
				
				if (last)
					$('.comments-container').append(tmpl('tmpl-comment-more',last));
				
				$('.content-container').scrollTop(0);
				$('.comments-container').css('margin-top','0px');
				$('.title-header').css('width',$('.content-container').width()+'px');
				$('.title-footer').css('width',$('.content-container').width()+'px');
			})
			.then(() => {
				yarr.do_color();
			});
	},
	hide_submission: function (submission,container) {
		if (container.is('.hidden'))
			submission.unhide()
				.then(() => {
					container.removeClass('hidden');
					util.snackbar('Unhidden!');
				});
		else
			submission.hide()
				.then(() => {
					container.addClass('hidden');
					util.snackbar('Hidden!');
				});
	},
	crosspost_submission: function (submission,container) {
		util.snackbar('Coming Soon!');
	},
	more_comments: function (comment_container,link_id,children) {
		if (!this.submission.isfetching) {
			this.submission.isFetching = true;
			
			this.snoowrap._get({
			  uri: 'api/morechildren',
			  qs: {api_type: 'json', children, link_id, limit_children: false}
			}).then(response => {
				comment_container.find('.comment-more').remove();
				response.json.data.things.forEach(
					comment => {
						comment_container
							.find('.comment-main[data-comment-id='+comment.parent_id.substring(3)+']')
							.parent()						
							.append(
								$('<div>')
									.addClass('comment-children')
									.html(
										$(tmpl((comment.count ? 'tmpl-comment-more' : 'tmpl-comment'),{ data: comment })).fixlinks()));
					});
				return response;
			}).then((response) => {
				yarr.do_color();
				this.submission.isFetching = false;
			});
		}
	},
	do_color: function () {
		$('	.comment-header-author:not(.comment-header-author[data-author="[deleted]"])')
				//.filter((i,e) => { return $.inArray($.trim($(e).attr('data-link-subreddit')),['gaming']) == -1; })
				//IMPORTANT: Apparently this has to be a function, not anonymous
				.css('color',function () { return util.generate_color($(this).attr('data-author')); });
		$('.link-header-subreddit, .title-header-subreddit, .subreddit')
				.filter((i,e) => { return $.inArray($.trim($(e).attr('data-link-subreddit')),['','all','popular']) == -1; })
				//IMPORTANT: Apparently this has to be a function, not anonymous
				.css('color',function () { return util.generate_color($(this).attr('data-link-subreddit')); });
			
	},
	vote: function (content,container,up) {
		var clazz = up ? 'upvoted' : 'downvoted';
		var unclazz = up ? 'downvoted' : 'upvoted';
		var scorechange = up ? 1 : -1;
		
		var score = container.find('.score');
		
		if (container.is('.'+clazz)) {
			container.removeClass(clazz);
			
			scorechange *= -1;

			content.unvote();
		} else if (container.is('.'+unclazz)) {
			container.addClass(clazz);
			container.removeClass(unclazz);

			(up ? content.upvote() : content.downvote())
			
			scorechange *= 2;
		} else {
			container.addClass(clazz);

			(up ? content.upvote() : content.downvote())
		}
		
		if (score.attr('data-score')) {
			score.attr('data-score',Number(score.attr('data-score'))+scorechange);
			score.text(tmpl.shortscore(score.attr('data-score')));
		}
	},
	get_container: function (type,event) {
		var container;
		
		switch (type) {
			case 'title':
				container = $('.title-container').find('.title-main');
			break;
			case 'submission':
				container = $(event.target).closest('.link-container');
			break;
			case 'comment':
				container = $(event.target).closest('.comment-container').find('.comment-main').first();
			break;
		}
		
		return container;
	},
	get_content: function (type,event) {
		var content;
		
		switch (type) {
			case 'title':
			case 'submission':
				content = this.snoowrap.getSubmission(this.get_container(type,event).attr('data-link-id'));
			break;
			case 'comment':
				content = this.snoowrap.getComment(this.get_container(type,event).attr('data-comment-id'));
			break;
		}
		
		return content;
	},
	init_listeners: function () {
		$('.links-container')
			.on('scroll',event => {
				if (($('.links-container').scrollTop() + $('.links-container').height()) / $('.links-container').prop('scrollHeight') > 0.75) {
					yarr.more_subreddit();
				}
			})
			.on('click','.link-main',event => {
				if (!$(event.target).is('.link-main-thumbnail-img')) {
					location.href = '#' + $(event.target).attr('data-link-url');
					yarr.load_submission($(event.target).closest('.link-container').attr('data-link-id'));
				}
			})
			.on('click','.upvote',event => { 
				this.vote(
					this.get_content('submission',event),
					this.get_container('submission',event),
					true) 
			})
			.on('click','.downvote',event => { 
				this.vote(
					this.get_content('submission',event),
					this.get_container('submission',event),
					false) 
			})
			.on('click','.overflow',event => {
				var container = $(event.target).closest('.link-container');
				var submission = yarr.snoowrap.getSubmission(container.attr('data-link-id'));
				
				util.overflowmenu(event.target,{'menu':[
				{
					'icon':'star_rate',
					'text':'<span class=\'save\'>Save</span><span class=\'unsave\'>Unsave</span>',
					'click':function () { yarr.save(submission,container); }
				},
				{
					'icon':'visibility_off',
					'text':'<span class=\'hide\'>Hide</span><span class=\'unhide\'>Unhide</span>',
					'click':function () { yarr.hide_submission(submission,container); }						
				},
				{
					'icon':'stars',
					'text':'Gild',
					'click':function () { yarr.gild(submission,container); }
				},
				{
					'icon':'link',
					'text':'Share Link',
					'click':function () { yarr.share(submission,container,true); }
				},
				{
					'icon':'share',
					'text':'Share Comments',
					'click':function () { yarr.share(submission,container,false); }
				},
				{
					'icon':'report',
					'text':'Report',
					'click':function () { yarr.report(submission); }						
				},
				{
					'icon':'shuffle',
					'text':'Crosspost',
					'click':function () { yarr.crosspost_submission(submission,container); }						
				}
				]});
				
				if (container.is('.saved'))
					$('.overflowmenu-container').addClass('saved');
				
				if (container.is('.hidden'))
					$('.overflowmenu-container').addClass('hidden');
				
				event.stopPropagation();
			});
		
		$('.content-container')
			.on('scroll',event => {
				var img = $('.title-image-img').outerHeight();
				var self = $('.title-self').outerHeight();
				
				img = typeof(img) == 'undefined' ? 0 : img;
				self = typeof(self) == 'undefined' ? 0 : self;
				
				var img_margin = img > 0 ? 10 : 0;
				var self_margin = self > 0 ? 32 : 0;
				
				if ($('.content-container').scrollTop() > img && !$('.title-header').is('.sticky')) {
					$('.title-header').addClass('sticky');
					
					if ($('.title-self').text() != '')
						$('.title-self').css('margin-top',($('.title-header').outerHeight())+'px');
					else
						$('.comments-container').css('margin-top',($('.title-header').outerHeight() + img_margin)+'px');
				}
				
				if ($('.content-container').scrollTop() > (img + self) && !$('.title-footer').is('.sticky')) {
					$('.title-footer')
						.addClass('sticky')
						.css('top',(33 + $('.title-header').outerHeight())+'px');
					
					if ($('.title-self').text() != '')
						$('.title-self').css('margin-top',($('.title-header').outerHeight() + self_margin)+'px');
					else
						$('.comments-container').css('margin-top',($('.title-header').outerHeight() + $('.title-footer').outerHeight() + img_margin + self_margin)+'px');
				}

				if ($('.content-container').scrollTop() <= (img + self) && $('.title-footer').is('.sticky')) {
					$('.title-footer').removeClass('sticky');
					
					if ($('.title-self').text() != '')
						$('.title-self').css('margin-top',($('.title-header').outerHeight())+'px');
					else
						$('.comments-container').css('margin-top',($('.title-header').outerHeight() + img_margin)+'px');
				}
				
				if ($('.content-container').scrollTop() <= img && $('.title-header').is('.sticky')) {
					$('.title-header').removeClass('sticky');
					
					if ($('.title-self').text() != '')
						$('.title-self').css('margin-top','0px');
					else
						$('.comments-container').css('margin-top','0px');
				}

			});
			
		$(window).on('resize',event => {
				$('.title-header').css('width',$('.content-container').width()+'px');
				$('.title-footer')
					.css('width',$('.content-container').width()+'px')
					.css('top',(33 + $('.title-header').outerHeight())+'px');
			});
		
		$('.comments-container')
			.on('contextmenu','.comment-main',event => {
				event.stopPropagation();

				$(event.target).closest('.comment-container').find('.comment-children,.comment-more').toggledisplay('block');
				$(event.target).closest('.comment-container').find('.comment-header-hidden:not(*[data-comments=0])').toggledisplay('inline');
				
				return false;
			})
			.on('click','.comment-main',event => {
				event.stopPropagation();
				
				$('.comments-container .comment-footer').not($(event.target).closest('.comment-container').find('.comment-footer').first()).css('display','none');
				$(event.target).closest('.comment-container').find('.comment-footer').first().toggledisplay('block');
			})
			.on('click','.upvote',event => {
				this.vote(
					this.get_content('comment',event),
					this.get_container('comment',event),
					true);
			})
			.on('click','.downvote',event => {
				this.vote(
					this.get_content('comment',event),
					this.get_container('comment',event),
					false);
			})
			.on('click','.gild',event => {
				this.gild(
					this.get_content('comment',event),
					this.get_container('comment',event)
				);
			})
			.on('click','.comment-more',event => { 
				this.more_comments(
					$(event.target).closest('.comment-container'),
					$('.comments-container').attr('data-link-id'),
					$(event.target).attr('data-comment-moreids'));
			});
			
		$('.subreddits-container')
			.on('click','.subreddit',event => {
				if ($(event.target).attr('data-link-subreddit'))
					window.location.href = '#/r/'+$(event.target).attr('data-link-subreddit');
				else
					window.location.href = '#';
				
				this.load_subreddit($(event.target).attr('data-link-subreddit'));
			});
			
		$('.title-container')
			.on('click','.upvote',event => {
				this.vote(
					this.get_content('title',event),
					this.get_container('title',event),
					true);
			})
			.on('click','.downvote',event => {
				this.vote(
					this.get_content('title',event),
					this.get_container('title',event),
					true);
			})
			.on('click','.save',event => {
				this.save(
					this.get_content('title',event),
					this.get_container('title',event)
				);
			})
			.on('click','.hide',event => {
				this.hide(
					this.get_content('title',event),
					this.get_container('title',event)
				);
			})
			.on('click','.gild',event => {
				this.gild(
					this.get_content('title',event),
					this.get_container('title',event)
				);
			})
			.on('click','.link',event => {
				this.share(					
					this.get_content('title',event),
					this.get_container('title',event),
					true
				);
			})
			.on('click','.share',event => {
				this.share(					
					this.get_content('title',event),
					this.get_container('title',event),
					false
				);
			})
			.on('click','.report',event => {
				this.report(
					this.get_content('title',event)
				);
			})
			.on('click','.crosspost',event => {
				this.crosspost_submission(					
					this.get_content('title',event),
					this.get_container('title',event)
				);
			});
		
		$(document).off("click", "#snackbar-container .snackbar");
	},
	init_materialdesign: function () {
		$('body').bootstrapMaterialDesign();
	},
	init_tmpl: function () {
		tmpl.shorttime = function(timestamp) { 
				var time = Math.floor(Date.now()/1000)-timestamp; 
				return (time < 60 ? time + 's' : (time < 60 * 60 ? Math.floor(time / 60) + 'm' : (time < 60 * 60 * 24 ? Math.floor(time / (60 * 60)) + 'h' : Math.floor(time / (60 * 60 * 24)) + 'd')));
				};
		tmpl.shortscore = function(score) { 
			return score > 1000 ? (score / 1000).toFixed(1) + 'k' : score;
			};
		tmpl.str = function(obj) {
			return JSON.stringify(obj);
		};
		tmpl.gilded = function (gilds) {
			return gilds > 1 ? 'x' + gilds : ''; 
		};
		tmpl.distinguish = function(o) {
			var badges = [];
			
			if (o.data && o.data.is_submitter)
				badges.push('S');
			
			var distinguish = o.data ? o.data.distinguished : o.distinguished;
			
			switch (distinguish) {
				case 'moderator': 
					badges.push('M');
				break;
				case 'admin': 
					badges.push('A');
				break;
				case 'special': 
					badges.push('\u0394');
				break;
			}
			
			return (badges.length == 0) ? '' : '[' + badges.join(',') + ']';
		};
		tmpl.countcomments = function(o) {
			var count = 0;
			if (o.data.replies != "" && o.data.replies != null) {
				o.data.replies.data.children.forEach((e) => {
					count += (e.kind == 'more') ? e.data.count : 1 + tmpl.countcomments(e);
				});
			}
			return count;
		};
		
		tmpl.isauthenticated = function() {
			return yarr.snoowrap.isauthenticated;
		}
		
		tmpl.author = function(author) {
			return author ? (author.name ? author.name : author) : '???';
		}
	},
	redirect_login: function () {
		window.location = 
			'https://www.reddit.com/api/v1/authorize?client_id='+
				client.clientId+
				'&response_type=code&state=8RVMH%2BTZyU8G31x1HB5hjw2vYr5%2BXd8NP19wMbd%2F6Vk%3D&redirect_uri='+
				encodeURIComponent(client.url)+
				'&duration=permanent&scope=account%20flair%20history%20identity%20mysubreddits%20privatemessages%20read%20report%20save%20submit%20subscribe%20vote'
	},
	init_snoowrap: function () {
		var uritoken;
		var refreshToken;
		
		if (yarrstorage.isavailable) {
			uritoken = new URL(window.location.href).searchParams.get('code');
			refreshToken = yarrstorage.item('refreshToken');
		}	
		
		if (refreshToken) {
			yarr.snoowrap = new yarrsnoowrap({
				clientId: client.clientId,
				clientSecret: client.clientSecret,
				refreshToken: refreshToken
			});
			
			return Promise
				.resolve(yarr.snoowrap)
				.then(() => {
					yarr.snoowrap.anonymous = false;
				});
		} else if (uritoken) {
			this.snoowrap = yarrsnoowrap.fromAuthCode({
				code: uritoken,
				clientId: client.clientId,
				redirectUri: client.url
			}).then((sw) => {
				yarrstorage.item('refreshToken',sw.refreshToken);
				window.location = client.url;
			});
			
			return null;
		} else {
			if (yarrstorage.isavailable)
				util.snackbar('Would you like to login?',
					{
						login:function () {
							util.dismisssnackbar($(this).closest('.snackbar'));
							yarr.redirect_login();
						},
						dismiss:function () { 
							util.dismisssnackbar($(this).closest('.snackbar'));
						}
					});
			
			const form = new FormData();
			form.set('grant_type', 'https://oauth.reddit.com/grants/installed_client');
			form.set('device_id', 'DO_NOT_TRACK_THIS_DEVICE');
			
			return fetch('https://www.reddit.com/api/v1/access_token', {
				method: 'post',
				body: form,
				headers: { authorization: 'Basic '+ btoa(client.clientId+':') },
				credentials: 'omit'
			}).then(response => { 
				return response.text();
			}).then(response => {
				yarr.snoowrap = new yarrsnoowrap({ 
					accessToken: JSON.parse(response).access_token 
				});
				yarr.snoowrap.anonymous = true;
			}).catch(() => {
				util.snackbar('Could not obtain anonymous user');
			});
		}
	},
	init_subreddits: function (subscriptions) {
		$('.subreddits-container').html('');
		
		subscriptions.sort((a,b) => { return a.display_name.toLowerCase() > b.display_name.toLowerCase() ? 1 : -1 });
		
		subscriptions.unshift({display_name:'popular'});
		subscriptions.unshift({display_name:'all'});
		subscriptions.unshift({display_name:'frontpage'});
		
		subscriptions.forEach((subreddit) => {
			$('.subreddits-container').append(tmpl('tmpl-subreddit',subreddit));
		});
		
		yarr.do_color();
		$('.subreddit[data-link-subreddit=""]').closest('.subreddit-container').addClass('selected');
	},
	init_location: function () {
		var locHashSplit = window.location.href.split('#');

		if (locHashSplit.length == 2 && locHashSplit[1] != '') {
			var locSlashSplit = locHashSplit[1].split('/');
			
			try {
				switch (locSlashSplit[1]) {
					case 'r':
						yarr.load_subreddit(locSlashSplit[2]);
						
						if (locSlashSplit[3])
							yarr.load_submission(locSlashSplit[3]);
					break;
					//case 'u':
						
					//break;
					default:
						window.location.href='#';
						yarr.load_subreddit();
					break;
				}
			} catch (e) {
				window.location.href='#';
				yarr.load_subreddit();
			}
		} else {
			window.location.href='#';
			yarr.load_subreddit();
		}
	},
	init: function () {
		yarrstorage.init();
		yarr.init_materialdesign();
		yarr.init_tmpl();
		yarr.init_listeners();
		
		if (!yarrstorage.isavailable)
			util.snackbar('Browser Storage Unavailable.<br>Settings will not be stored and<br>you will not be able to login',{dismiss:function () { util.dismisssnackbar($(this).closest('.snackbar')); }});
		
		yarr.init_snoowrap()
			.then(() => {
				yarr.snoowrap.config({continueAfterRatelimitError: true});
				
				(yarr.snoowrap.anonymous ?
					yarr.snoowrap.getDefaultSubreddits({limit: 1000}) :
					yarr.snoowrap.getSubscriptions({limit: 1000}))
					.then(yarr.init_subreddits)
					.then(yarr.init_location);
			});
	},
};

var util = {
	hashCode: function(str) { // java String#hashCode
		if (str == null) return 0;
		var hash = 0;
		for (var i = 0; i < str.length; i++) {
		   hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		return hash;
	},
	intToRGB: function(i){
		var c = (i & 0x00FFFFFF)
			.toString(16)
			.toUpperCase();

		return "00000".substring(0, 6 - c.length) + c;
	},
	lighten_color: function (color) {
        //25%
        var amt = Math.round(2.55 * 25);
        var R = (color >> 16 & 0xFF) + amt;
        R = (R > 255 ? 255 : R) << 16;
        var G = (color >> 8 & 0xFF) + amt;
        G = (G > 255 ? 255 : G) << 8;
        var B = (color & 0xFF) + amt;
        B = (B > 255 ? 255 : B);
        return R | G | B;
    },
	generate_color: function (string) {
		return util.intToRGB(util.lighten_color(util.hashCode(string)));
	},
	snackbar: function (text,buttons) {
		if (typeof buttons == 'undefined') {
			var snackbar = $.snackbar({content:text,timeout:0, htmlAllowed: true});
			
			setTimeout(
				function () { 
					util.dismisssnackbar(snackbar);
				},2000);
		} else {
			var html = $('<div>')
							.append($('<div>').html(text))
							.append($('<div>').addClass('buttons'));

			Object.keys(buttons).forEach(
				button => {
					html
						.find('.buttons')
						.append(
							$('<span>')
								.html(button)
								.attr('id',button));
				});
			
			var snackbar = $.snackbar({content:html.html(),timeout:0, htmlAllowed: true});
			
			Object.keys(buttons).forEach(
				button => {
					snackbar.find('#'+button).on('click',buttons[button]);
				});
		}
	},
	dismisssnackbar: function (snackbar) {
		snackbar.addClass('snackbar-closed');
		setTimeout(
			function () {
				snackbar.remove();
			},200);
	},
	overflowmenu: function (element,menu) {
		var overflow = $(tmpl('tmpl-overflow',menu));
		var rect = element.getBoundingClientRect();
		
		$('*:not(body):not(html)')
			.css('pointer-events','none');
		$('body')
			.append(overflow);
		$('.overflowmenu-container')
			.css('top',rect.top+'px')
			.css('left',rect.left+'px');
		$('body').on('click',util.overflowmenuclose);
		$('.overflowmenu-container .overflowmenu-item').each((i,e) => $(e).on('click',menu.menu[i].click));		
	},
	overflowmenuclose: function () {
		//animate
		$('*:not(body):not(html)').css('pointer-events','');
		$('.overflowmenu-container').remove();
	},
	copytoclipboard: function (text) {
		var textarea = $('<textarea>').val(text);
		$('body').append(textarea);
		
		textarea.focus().select();
		
		try {
			document.execCommand('copy');
			util.snackbar('Copied to clipboard!');
		} catch (e) {
			util.modalprompt('Copy','Automatic copy failed. Please copy this manually','',{});

			$('.modalprompt input')
				.val(text)
				.focus().select();
		}
		
		textarea.remove();
	},
	modalprompt: function (title,text='',deftext='',buttons) {
		var modal = $('.modalprompt');
		
		modal.find('input')
			.attr('placeholder',deftext)
			.attr('aria-label',deftext);
			
		modal.find('.modal-title')
			.text(title);
		
		modal.find('.modal-body p')
			.text(text);
			
		if (buttons)
			Object.keys(buttons).forEach(button => {
				modal.find('.modal-footer')
					.append(
						$('<button>')
							.addClass('btn')
							.addClass('btn-primary')
							.text(button)
					);
				
				modal.find('.modal-footer')
					.find('button')
					.last()
					.on('click',buttons[button]);
			});
		
		modal.modal({ keyboard: true });
	},
	modalpromptdismiss: function () {
		$('.modalprompt').modal('hide');
	}
};

var yarrstorage = {
	init: function () {
		this.isavailable = (typeof(Storage) !== "undefined");
	},
	item: function (name,value) {
		if (this.isavailable) {
			if (typeof(value) != 'undefined') {
				localStorage.setItem(name, value);
			} else {
				return localStorage.getItem(name);
			}
		} else {
			util.snackbar('Error: Local Storage Unavailable');
		}		
	},
	delete: function (name) {
		if (this.isavailable)
			localStorage.removeItem(name);
	}
};

$.fn.toggledisplay = function (vis) {
	this.css('display',this.css('display')=='none' ? vis : 'none');
};

$.fn.fixlinks = function () {
	var links = this.find('a');
	var redditlinks = links.filter(function () {
		return $(this).attr('href').indexOf('/r/') == 0 || $(this).attr('href').indexOf('/u/') == 0;
	});
	
	links.not(redditlinks).attr('target','_blank');
	redditlinks.attr('href',function () { return '#'+$(this).attr('href'); });
	
	return this;
}

Array.prototype.last = function(){
	return this[this.length - 1];
};

$(document).ready(yarr.init);
$(document).on('contextmenu',function () { return false; });