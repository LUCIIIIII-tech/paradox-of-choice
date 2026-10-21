"""Write the YouTube title, description (with chapters from the real timeline) and tags: python3 youtube.py [en|tl] -> youtube_<lang>.txt"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); LANG = sys.argv[1] if len(sys.argv) > 1 else 'en'; SUF = '' if LANG == 'tl' else '.' + LANG
LN = {l['id']: l for l in json.load(open(os.path.join(HERE, f'timeline{SUF}.json')))['lines']}
ts = lambda id: '%d:%02d' % divmod(int(LN[id]['t0']), 60)
C = {
 'en': dict(title="What If You Could Hear Everyone's Thoughts for One Day?",
   chapters=[('c01', "What if you could hear everyone's thoughts?"), ('h01', '7:00 AM: The kitchen (Question 1)'), ('t01', '8:00 AM: The train and the white bear (Question 2)'),
             ('s01', '9:00 AM: Coffee on your shirt (Question 3)'), ('l01', '12:00 PM: Lunch with your best friend'), ('r01', '3:00 PM: Your crush (Question 4)'),
             ('d01', '6:00 PM: The thought on the platform (Question 5)'), ('n01', '10:00 PM: Alone with your own mind (Question 6)'), ('m01', '11:59 PM: The secret'), ('o01', 'Your score')],
   body="""Tomorrow morning you wake up and you can hear what everyone is thinking, until midnight. Your mom, your little brother, a packed train, your boss, your best friend, your crush, a stranger on the platform. And by the end of the day you learn one secret about people that changes how you see yourself.

PLAY ALONG: answer every question out loud before the timer runs out. Comment your score out of 4, and your answers to questions 5 and 6.

Whose thoughts would you want to hear first?""",
   src='Sources', tags='what if, psychology, hear thoughts, mind reading, spotlight effect, liking gap, intrusive thoughts, white bear, inner voice, psychology facts, interactive quiz'),
 'tl': dict(title='Paano Kung Marinig Mo ang Iniisip ng Lahat sa Loob ng Isang Araw?',
   chapters=[('c01', 'Paano kung marinig mo ang isip ng lahat?'), ('h01', '7:00 AM: Sa kusina (Tanong 1)'), ('t01', '8:00 AM: Sa tren at ang puting oso (Tanong 2)'),
             ('s01', '9:00 AM: Natapong kape (Tanong 3)'), ('l01', '12:00 PM: Kasama ang best friend'), ('r01', '3:00 PM: Ang crush mo (Tanong 4)'),
             ('d01', '6:00 PM: Ang isip sa platform (Tanong 5)'), ('n01', '10:00 PM: Mag-isa sa sariling isip (Tanong 6)'), ('m01', '11:59 PM: Ang sikreto'), ('o01', 'Ang score mo')],
   body="""Bukas ng umaga, gigising ka at maririnig mo ang iniisip ng lahat, hanggang hatinggabi. Ang nanay mo, ang bunso mong kapatid, ang siksikang tren, ang boss mo, ang best friend mo, ang crush mo, at isang estranghero sa platform. At bago matapos ang araw, may matutuklasan kang isang sikreto tungkol sa mga tao.

SUMABAY KA: sagutin mo nang malakas ang bawat tanong bago maubos ang oras. I-comment ang score mo out of 4, at ang sagot mo sa tanong 5 at 6.

Kaninong isip ang gusto mong unang marinig?""",
   src='Mga pinagkunan', tags='paano kung, psychology, sikolohiya, isip, spotlight effect, liking gap, intrusive thoughts, puting oso, tagalog, interactive quiz'),
}[LANG]
SRC = ['Tseng & Poppenk (2020), Nature Communications: ~6,200 new thoughts a day', 'Wegner et al. (1987): the white bear', 'Killingsworth & Gilbert (2010), Science: minds wander ~47% of the time',
       'Gilovich, Medvec & Savitsky (2000): the spotlight effect', 'Boothby et al. (2018), Psychological Science: the liking gap', 'Gilovich, Savitsky & Medvec (1998): the illusion of transparency',
       'Radomsky et al. (2014): intrusive thoughts in 13 countries', 'Nedergaard & Lupyan (2024), Psychological Science: not everybody has an inner voice']
out = [C['title'], '', C['body'], ''] + ['%s %s' % (ts(i), s) for i, s in C['chapters']] + ['', C['src'] + ':'] + ['- ' + s for s in SRC] + ['', 'Tags: ' + C['tags']]
open(os.path.join(HERE, f'youtube_{LANG}.txt'), 'w').write('\n'.join(out) + '\n'); print('\n'.join(out))
