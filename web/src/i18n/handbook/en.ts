// Eingebautes Handbuch von MixMarket auf Englisch; Kapitel und Abschnitts-Kennungen sind identisch mit de.ts
import type { HandbookChapter } from '../../types/handbook'

export const handbookEn: HandbookChapter[] = [
  {
    id: 'start',
    title: 'Getting started',
    summary: 'How to set up MixMarket on first start, what to enter before your first send, and how you get from a company search to a sent campaign or a personal email from the outbox.',
    sections: [
      {
        id: 'what-is-mixmarket',
        title: 'What MixMarket is for',
        blocks: [
          {
            type: 'p',
            text: 'MixMarket helps you find companies that suit your products, check them and contact them by email in a targeted way. Research and sending are kept apart: first you collect and rate companies, then you decide whom you actually write to.',
          },
          {
            type: 'p',
            text: 'The work is spread over a few areas: in **Research** you find and rate companies, in **Contacts** and **Lists** you manage your recipients, in **Templates** you write your emails, and in **Campaigns** and **Automations** you send them.',
          },
          {
            type: 'p',
            text: 'There is also a second way: in the **Outbox**, the AI writes a personal email to each company individually. You check and approve every email; MixMarket sends it and follows up if you wish. You need neither a template nor a campaign for this.',
          },
          {
            type: 'p',
            text: 'MixMarket collects replies to your emails in **Conversations**. It reads your mailbox for this, recognises bounces and out-of-office replies, and ends the sequence in the outbox as soon as someone replies. As long as the Replies autopilot is switched on, the AI sorts every reply and, for interest or a question, writes a reply draft. A reply only goes out when you click **Send**.',
          },
          {
            type: 'p',
            text: 'MixMarket can also do much of this by itself. With the **Autopilot** on the **Overview**, it analyses and rates companies, puts suitable companies into the outbox, sends approved emails and sorts replies, depending on which areas you switch on. The **Emergency stop** halts all sending at any time (Overview).',
          },
        ],
      },
      {
        id: 'navigation',
        title: 'Finding your way around',
        blocks: [
          {
            type: 'p',
            text: 'The bar at the top holds all areas, with a few tools on the right.',
          },
          {
            type: 'list',
            items: [
              'Open **Overview**, **Contacts**, **Lists**, **Templates**, **Campaigns**, **Automations**, **Research**, **Outbox** and **Conversations** directly from the top bar. There they appear as text only, without icons. A number after **Conversations** shows how many replies are still open. Clicking the MixMarket wordmark takes you to the **Overview**. It is the control centre with **Waiting for you**, autopilot, emergency stop and usage (Overview).',
              'If the emergency stop is active, a red bar with the button **Release sending** appears at the top of every page. If the AI is paused, a yellow bar appears there.',
              '**Search** opens the search across all areas. You can also press Cmd K on a Mac or Ctrl K on Windows and Linux. The button shows the right shortcut for your device.',
              'The sun or moon icon switches between the light and dark theme, the DE or EN button switches the language.',
              'The question mark opens this handbook. In addition, every page has a **Help** button next to its title that leads straight to the matching chapter.',
              'Clicking your initials opens the user menu. It shows the name and email of your account at the top, followed by **Suppression**, **Activity**, **Settings**, **Guided tours**, **Check for updates** and **Sign out**. When a new version of MixMarket is out, a small pulsing dot on your initials shows it, and the menu item reads **Update available** (Settings, Updates). **Sign out** ends all sign-ins on all devices, including a second browser or your phone.',
              'In a narrow window, for example on a phone, the top bar shows a menu button instead. It opens a side panel with all areas and their icons, including **Suppression**, **Activity**, **Handbook** and **Settings**, plus theme, language and **Sign out**. There, too, **Conversations** shows the number of open replies.',
            ],
          },
        ],
      },
      {
        id: 'first-start',
        title: 'First start and recovery key',
        blocks: [
          {
            type: 'p',
            text: 'MixMarket has exactly one account. There are no roles and no sign-up for further users. On the very first start, as long as no account exists, the page **Set up MixMarket** appears instead of the sign-in.',
          },
          {
            type: 'p',
            text: 'On the computer that runs MixMarket, you set it up without any further input. From another computer, the page additionally asks for **Setup code** at the very top. Any request that arrives through an intermediary in front of MixMarket, such as a reverse proxy, also counts as another computer. MixMarket writes the code to the server log when the server starts, as long as no account exists, for example in the form ABCD-EFGH. After every restart a new code applies. Upper and lower case do not matter. If the field is empty, MixMarket reports “Please fill in all fields.”, if the code is wrong, “The setup code is missing or wrong.” In both cases MixMarket does not create an account.',
          },
          {
            type: 'steps',
            items: [
              'Enter **Your name**, **Email** and **Password**, and enter the password a second time under **Repeat password**. The password needs at least 10 characters. The eye icon shows what you typed.',
              'Click **Create account**.',
              'MixMarket now shows your **Recovery key** once: 6 groups of 4 characters, separated by dashes. With it you set a new password if you forget yours.',
              'Keep the key with **Copy** or **Save as file**. The text file contains the account email, the key and short instructions. You can also print it or write it down.',
              'Tick **I have stored the key safely.** and click **Continue to MixMarket**. Without the tick you cannot continue.',
            ],
          },
          {
            type: 'warning',
            text: 'The key is shown only this once. Keep it in a safe place, not on this computer alone. Anyone who knows the key and your email can set a new password.',
          },
          {
            type: 'p',
            text: 'After that you sign in on the sign-in page with **Email** and **Password**. The eye icon in the password field shows what you typed, the button at the top right switches the language. If you have forgotten the password, click **Forgot password?** (Settings, Forgot password).',
          },
          {
            type: 'p',
            text: 'If the server cannot be reached when you open or reload MixMarket, the notice “Connecting to the server” appears instead of the sign-in page. MixMarket tries again every 3 seconds and opens the page as soon as the server responds. Your sign-in stays in place.',
          },
          {
            type: 'tip',
            text: 'You change name, email and password later in **Settings**, section **Account**. That is also where you create a new key if needed.',
          },
        ],
      },
      {
        id: 'setup',
        title: 'Set up first',
        blocks: [
          {
            type: 'p',
            text: 'Before you send your first real email, set MixMarket up once. This requires your account from the first start (section First start and recovery key). Steps 1 to 4 are needed for the full workflow, step 5 only for paid search sources.',
          },
          {
            type: 'steps',
            items: [
              'Company: open **Settings** from the user menu. Under **Company**, enter the **Company name** and the **Postal address (required in footer)** and click **Save**. The postal address appears at the bottom of every email you send.',
              'Mailbox: in the **Mailbox** section, enter the details of your email account, at least the outgoing server under **Sending (SMTP)**. Check the access with **Test connection** and save with **Save mailbox**. As long as no mailbox is set up, MixMarket runs in test mode and sends no real emails. So that MixMarket can read replies in **Conversations**, also enter the incoming server under **Receiving (IMAP)**.',
              'Create a product: go to **Research** and click **Create first product** or **Manage products** at the top. Describe what you sell and who your ideal customer is. The AI rating is based on this.',
              'Connect the AI: in **Settings**, section **AI rating**, choose your **Subscription**, click **Check connection** and then **Save AI settings**. The AI then rates companies and writes the emails in the **Outbox**.',
              'Optional search sources: if you want to use DataForSEO or Serper in addition to OpenStreetMap, enter the access details in **Settings** under **Research access**.',
            ],
          },
          {
            type: 'p',
            text: 'As long as setup is not finished, the **Overview** shows the list **Getting started** at the very top under **Waiting for you**: **Enter company name and postal address**, **Choose the AI and check the connection**, **Set up the mailbox**, **Create your first product** and **Run your first company search**. Clicking a step takes you to the right place in Settings or in Research. If it is marked **guided**, the click starts a guided tour (Getting started, Guided tours). Completed steps get a check mark, and next to the title you see the progress, for example “2 of 5 done”. Once all steps are done, the list disappears (Overview, Waiting for you).',
          },
          {
            type: 'tip',
            text: 'Details on every field are in the Settings chapter, details on products in the Research chapter.',
          },
        ],
      },
      {
        id: 'tours',
        title: 'Guided tours',
        blocks: [
          {
            type: 'tip',
            text: 'Guided tours are part of MixMarket Pro. Without Pro, the **Guided tours** buttons on the overview, in the handbook and in the user menu show what the tours can do.',
          },
          {
            type: 'p',
            text: 'A guided tour takes you through a task step by step. The page is dimmed, only the next field or button is highlighted, and a speech bubble tells you what to do. Once you have done it, the tour moves on by itself. You work with your real data: whatever you enter is saved.',
          },
          {
            type: 'list',
            items: [
              'Start: You find all tours via **Guided tours** at the top right of the **Overview** and the **Handbook**, and in the user menu behind your initials. Under **Getting started** on the overview, steps marked **guided** start the matching tour.',
              'Use: **Next** goes to the next step, **Back** to the previous one. If a field is still empty, the speech bubble says so and the field is marked red. If something has to be clicked, the speech bubble says so.',
              'Interrupt: The cross at the top of the speech bubble ends the tour. If you reload the page, the tour continues at the same point. If a window was closed by mistake, **Open again** opens it again.',
            ],
          },
          {
            type: 'tip',
            text: 'Completed tours get a tick in the list. You can repeat any tour as often as you like.',
          },
          {
            type: 'p',
            text: 'The **Guided tours** list sorts the 22 tours into four groups:',
          },
          {
            type: 'list',
            items: [
              '**Set up**: Enter your company, Set up the mailbox, Set up the AI, Paid search sources, Account and password.',
              '**Find customers and write to them personally**: Create a product, Find companies, Analyse companies, Build and rate a target group, Add prospects, Contact prospects, Check and approve emails, Read web pages.',
              '**Mailings to many**: Add and import contacts, Create a list, Create a template, Create and send a campaign, Automatic follow-up.',
              '**Day to day**: Handle replies, Suppression list, Autopilot, limits and emergency stop, Tour of the app.',
            ],
          },
          {
            type: 'tip',
            text: 'A tour never sends anything by itself. Emails only go out when you click **Send now**, **Send**, **Approve** or **Save** on an automation yourself. Beforehand the speech bubble tells you that real emails will be sent.',
          },
        ],
      },
      {
        id: 'workflow',
        title: 'The typical workflow',
        blocks: [
          {
            type: 'p',
            text: 'This is how you get from the first company search to a sent campaign. The chapter in brackets describes each step in detail.',
          },
          {
            type: 'steps',
            items: [
              'Find companies: in **Research**, tab **Find companies**, start a search by trade and place with **New search** (Research).',
              'Analyse: when the search is done, click **Analyse companies**. MixMarket reads the company websites and collects contact persons, email addresses and signals (Research).',
              'Build a target group: in the **Target groups** tab, choose signals that must or must not apply. The number of matching companies updates instantly (Research).',
              'Rate with AI: click **Rate with AI**. The AI gives each company a fit from 1 to 10 and suggests an angle for the first contact (Research).',
              'Add prospects: move the suitable companies to the **Prospects** tab with **Add** (Research).',
              'Add to contacts: in the **Prospects** tab, click **Add to contacts**. Companies with an email address become contacts and go into the product’s prospect list, except prospects with the status Not interested (Research, Lists).',
              'Write a template: in **Templates**, write the email and insert placeholders such as {{anrede}} and {{ansatz}} (Templates).',
              'Create a campaign: in **Campaigns**, create a campaign with **New campaign**, choosing the template and the prospect list (Campaigns).',
              'Check and send: click **Send now** or **Schedule**. Beforehand, MixMarket shows the number of recipients and any warnings. Without a template or without permitted recipients, MixMarket refuses to send or schedule (Campaigns, Law and deliverability).',
              'Review and follow up: you see opens and clicks in the campaign list and on the **Overview**. With **Automations** you can send a follow-up email automatically (Overview, Automations).',
            ],
          },
          {
            type: 'p',
            text: 'From step 6 there is an alternative: instead of contacts, template and campaign, you write to prospects individually through the outbox.',
          },
          {
            type: 'steps',
            items: [
              'Contact: in the **Prospects** tab, click **Contact** in a row or **Contact new** at the top right. The AI then writes a personal first email for each company (Outbox).',
              'Check and approve: in **Outbox**, tab **To approve**, read the emails, change them if needed and click **Approve** (Outbox).',
              'Send and follow up: MixMarket sends the approved emails according to your **Sending rules**. The AI later writes the follow-ups from the product’s **Sequence** in the same thread (Outbox).',
            ],
          },
          {
            type: 'p',
            text: 'For both ways: when a recipient replies, you find the reply in **Conversations**. A running sequence in the outbox then ends by itself. With the Replies autopilot switched on, the AI sorts the reply and, for interest or a question, writes a reply draft that you check and send with **Send** (Conversations).',
          },
          {
            type: 'p',
            text: 'What needs doing next, that is approvals, new replies, drafts, errors and notices, is collected under **Waiting for you** on the **Overview**. That is also where you switch on the autopilot: Research takes over analysing and rating saved target groups, Writing puts suitable companies from the minimum fit into the outbox (Overview, Autopilot).',
          },
          {
            type: 'warning',
            text: 'Contacts from research have no documented consent. Email advertising without consent may be unlawful. Read the Law and deliverability chapter before your first send.',
          },
        ],
      },
    ],
  },
  {
    id: 'dashboard',
    title: 'Overview',
    summary: 'The start page is the control centre of MixMarket: Waiting for you, autopilot, emergency stop, limits and usage, followed by key figures, send activity and quick actions.',
    sections: [
      {
        id: 'control-center',
        title: 'The Overview as control centre',
        blocks: [
          {
            type: 'p',
            text: 'The **Overview** opens after you sign in. Here you see what needs doing and control what MixMarket does by itself. From top to bottom it shows:',
          },
          {
            type: 'list',
            items: [
              '**Waiting for you**: as long as setup is not finished, first the list **Getting started**, then your open tasks and notices, for example about unsubscribes or an emergency stop.',
              '**Controls**: the **Autopilot** per area, the **Emergency stop** and the **Limits**.',
              '**Usage**: how heavily your AI subscriptions are used, how often the AI has worked and what was sent today.',
              'Below that come key figures, send activity and quick actions.',
            ],
          },
          {
            type: 'p',
            text: 'Waiting for you and the controls refresh by themselves every 30 seconds, the usage every 2 minutes.',
          },
          {
            type: 'p',
            text: 'If the emergency stop is active or the AI is paused, a bar also appears at the top of every page (sections Emergency stop and AI pause). Everything concerning the controls is listed in **Activity** under the area **Controls**.',
          },
        ],
      },
      {
        id: 'waiting',
        title: 'Waiting for you',
        blocks: [
          {
            type: 'p',
            text: 'As long as setup is not finished, **Waiting for you** shows the list **Getting started** at the very top, with the progress, for example “2 of 5 done”. Each step has a short hint below it. Clicking a step takes you to the right place or, if it is marked **guided**, starts a guided tour. Completed steps get a check mark. Once all five are done, the list disappears.',
          },
          {
            type: 'terms',
            items: [
              { term: 'Enter company name and postal address', text: 'Done as soon as **Company name** and **Postal address (required in footer)** are saved. Takes you to **Settings**, section **Company**.' },
              { term: 'Choose the AI and check the connection', text: 'Done as soon as a **Subscription** is saved. Takes you to **Settings**, section **AI rating**.' },
              { term: 'Set up the mailbox', text: 'Done as soon as a mailbox with an outgoing server is saved and MixMarket no longer runs in test mode. Takes you to **Settings**, section **Mailbox**.' },
              { term: 'Create your first product', text: 'Done as soon as there is at least one product. Takes you to **Research**.' },
              { term: 'Run your first company search', text: 'Done as soon as at least one search has finished. Takes you to **Research**.' },
            ],
          },
          {
            type: 'p',
            text: 'Below that, **Waiting for you** lists your open tasks, each with its count. Clicking a row takes you to the page where you deal with it. Tasks with nothing open do not appear.',
          },
          {
            type: 'terms',
            items: [
              { term: 'Emails to approve', text: 'Finished emails in the outbox waiting for your approval. Leads to the **Outbox**.' },
              { term: 'New replies', text: 'Open replies in **Conversations**.' },
              { term: 'Reply drafts', text: 'Finished drafts in **Conversations** waiting for you to check and send them.' },
              { term: 'Outbox errors', text: 'Emails in the outbox with an error, for example because the AI could not write or sending failed. Leads to the **Outbox**.' },
              { term: 'New bounces', text: 'Permanent bounces that you have not yet closed with **Done** in **Conversations**.' },
              { term: 'Paused campaigns', text: 'Campaigns with the status Paused, for example after an emergency stop. Leads to **Campaigns**.' },
              { term: 'Mailbox check error', text: 'The mailbox cannot be checked. The row gives the mail server’s message and leads to **Conversations**.' },
            ],
          },
          {
            type: 'p',
            text: 'Below are notices with date and time, newest first, at most 50:',
          },
          {
            type: 'list',
            items: [
              'A recipient unsubscribed via the link in an email.',
              'A recipient wants no more emails, by reply. The notice appears when the address was newly suppressed as a result.',
              'An email was permanently undeliverable, and the address is suppressed.',
              'The emergency stop was triggered automatically, with the number of bounces and emails in 24 hours. An emergency stop you trigger yourself is not listed here.',
              'The AI is paused, with the subscription’s usage and, if known, the end of the pause.',
            ],
          },
          {
            type: 'p',
            text: '**Done** removes a notice from the list. If there are several, **Dismiss all notices** clears them all at once. This changes nothing about the event itself; a suppressed address stays suppressed. If nothing is open and setup is finished, it reads “All done. Nothing is waiting for you.”',
          },
          {
            type: 'tip',
            text: 'MixMarket reports unsubscribes and suppressed addresses only here, not by email to you. So check the Overview regularly.',
          },
        ],
      },
      {
        id: 'autopilot',
        title: 'Autopilot',
        blocks: [
          {
            type: 'tip',
            text: 'The autopilot for **Research**, **Writing** and **Replies** is part of MixMarket Pro. Without Pro, a Pro note appears instead of the switch. The **Sending** switch is part of the free version.',
          },
          {
            type: 'p',
            text: 'Under **Controls** you switch the **Autopilot** **On** or **Off** for four areas, each with its own switch. Every change applies immediately, and MixMarket confirms it with “Controls saved”.',
          },
          {
            type: 'terms',
            items: [
              { term: 'Research', text: 'MixMarket analyses finished searches that have never been analysed by itself, one after another, oldest first. It also rates saved target groups with a product by itself, namely the companies without a current rating. Only one rating run takes place at a time. Rating only happens with an AI provider selected and not during an AI pause.' },
              { term: 'Writing', text: 'Companies from saved target groups with a product that have a current rating for this product and reach at least the **Minimum fit** are added as prospects and put into the outbox. Only prospects with the status New and a known email address that are not yet in the outbox go there, highest fit first. Per day, MixMarket creates at most as many first emails as the outbox’s **Daily limit** allows. First emails you start yourself on the same day count towards this. Writing needs an AI provider to be selected.' },
              { term: 'Sending', text: 'The outbox sends approved emails according to your sending rules. Off: the outbox sends nothing. The AI keeps writing, and approved emails wait. This switch does not affect campaigns, automations or replies in **Conversations**.' },
              { term: 'Replies', text: 'The AI sorts incoming replies and, for interest or a question, writes a draft. Off: new replies are not sorted and get no automatic draft. They show **AI is sorting** and wait until you switch it on again. Drafts you request yourself are still written by the AI.' },
            ],
          },
          {
            type: 'p',
            text: 'You choose the **Minimum fit** next to the Writing area, from 5 to 10. By default, Research and Writing are off, Sending and Replies are on, and the minimum fit is from 7.',
          },
          {
            type: 'p',
            text: 'Research and Writing run every 10 minutes. When you switch one of them on, the first run starts immediately. Their steps appear in **Activity** with the actor “Autopilot”: analyses and ratings started, new prospects and emails in the outbox.',
          },
          {
            type: 'tip',
            text: 'Approval still applies: if **Approve every email before sending** is ticked in a product’s **Sequence**, the autopilot’s emails also wait in the **To approve** tab.',
          },
          {
            type: 'warning',
            text: 'Companies from research have no documented consent. The Writing autopilot creates emails to such companies without you choosing each company. Email advertising without consent may be unlawful under German UWG § 7. Keep approval ticked in the sequence and check each case (Law and deliverability).',
          },
        ],
      },
      {
        id: 'emergency-stop',
        title: 'Emergency stop',
        blocks: [
          {
            type: 'p',
            text: 'Next to the autopilot is the **Emergency stop**. While everything is running, it shows **Sending is running**. If you click **Emergency stop** and confirm, MixMarket stops all sending immediately:',
          },
          {
            type: 'list',
            items: [
              'The outbox sends no more emails. The AI keeps writing, and approved emails wait. An email whose sending had just begun also stays approved.',
              'A running campaign stops and is then Paused. Recipients who have not received the email yet stay open. After releasing, you resume the campaign yourself under **Campaigns** with **Resume**.',
              'Scheduled campaigns do not start. They stay scheduled and start after the release once their time has come.',
              'Automations send no follow-up emails. MixMarket checks the emergency stop before every single follow-up; the remaining ones stay scheduled and go out after the release.',
              'No reply can be sent in **Conversations**. The draft stays waiting for approval.',
              'MixMarket refuses **Send now** and **Resume** for a campaign with the message “Sending is stopped by the emergency stop.”',
            ],
          },
          {
            type: 'p',
            text: 'The emergency stop then shows **Sending stopped**, the reason and since when. A red bar “Emergency stop active: nothing is being sent.” with the button **Release sending** appears at the top of every page.',
          },
          {
            type: 'p',
            text: 'With **Release sending**, on the Overview or in the red bar, you lift the emergency stop after a confirmation. Outbox, scheduled campaigns, follow-up automations and replies then run again. Paused campaigns do not continue by themselves.',
          },
          {
            type: 'p',
            text: 'Automatic emergency stop: when a permanent bounce arrives, MixMarket counts the permanent bounces of the last 24 hours. The emergency stop triggers if their share of the emails sent reaches at least the limit under **Emergency stop at bounce rate** and at least 20 emails were sent, or if there are 10 bounces or more. An automatic emergency stop appears as a notice under **Waiting for you**.',
          },
          {
            type: 'list',
            items: [
              'Emails from the outbox and campaigns, follow-up emails from automations and replies in **Conversations** count as sent. Test sends from the outbox and Conversations do not count.',
              'MixMarket only recognises bounces if receiving (IMAP) is set up (Conversations, Bounces).',
            ],
          },
          {
            type: 'warning',
            text: 'After an automatic emergency stop, check the bounces in **Conversations** in the **Undeliverable** view before you release sending.',
          },
        ],
      },
      {
        id: 'limits',
        title: 'Limits',
        blocks: [
          {
            type: 'p',
            text: 'Under **Limits** you set when MixMarket steps in by itself. Every change applies immediately.',
          },
          {
            type: 'list',
            items: [
              '**Emergency stop at bounce rate**: the share of permanently undeliverable emails in 24 hours from which the automatic emergency stop triggers. You can choose 2, 3, 5, 8, 10 or 15 %; the default is 5 %. With 10 bounces in 24 hours it always triggers.',
              '**AI pause from usage**: the usage of the selected AI subscription from which the AI pauses. You can choose 50 to 95 % or **never**; the default is 80 %. **never** switches the AI pause off.',
            ],
          },
        ],
      },
      {
        id: 'usage',
        title: 'Usage',
        blocks: [
          {
            type: 'p',
            text: 'For the **Claude subscription** and the **ChatGPT subscription (Codex)**, one bar each shows the usage over **5 hours** and over the **Week**, with the time the period resets below. The subscription selected in the settings carries the badge **selected**. Only there does a line in the bar mark the limit of the AI pause.',
          },
          {
            type: 'list',
            items: [
              'Claude: MixMarket queries the usage through an officially undocumented Anthropic interface, using the local sign-in key of Claude Code on this computer. If Claude Code is not signed in or the query is not possible, “Not available” is shown with the reason.',
              'ChatGPT: MixMarket reads the values last reported by Codex from its files on this computer, read only. “As of” shows when Codex reported them. If a period has expired since then, MixMarket shows 0 %. If Codex has not reported anything yet, the value is not available.',
              'Both ways can change without notice. MixMarket queries the values again at most every 5 minutes, after an error after one minute.',
            ],
          },
          {
            type: 'p',
            text: '**AI calls** counts in the columns **24 hours** and **7 days** how often the AI worked, separately for **Rating**, **Outbox** and **Conversations**. Failed calls of the last 24 hours are shown separately next to it.',
          },
          {
            type: 'p',
            text: '**Sent today** shows:',
          },
          {
            type: 'list',
            items: [
              '**Outbox**: emails sent today out of your daily limit, for example “3 of 20”. Test sends are included and named separately.',
              '**Campaigns**: campaign emails sent today.',
              '**Follow-up automations**: follow-up emails from automations sent today.',
              '**Replies**: replies sent today in **Conversations**, without test sends.',
              '**Bounces in 24 hours**: the number of permanent bounces, their share of the emails sent and the set limit. Once the limit is reached, the value is shown in red.',
            ],
          },
          {
            type: 'p',
            text: '**Refresh** reloads all values immediately and queries both subscriptions again.',
          },
        ],
      },
      {
        id: 'ai-pause',
        title: 'AI pause',
        blocks: [
          {
            type: 'p',
            text: 'If the selected AI subscription reaches the limit under **AI pause from usage** over 5 hours or over the week, the AI pauses. The pause ends as soon as the usage is below the limit again, usually when the period resets. During the pause:',
          },
          {
            type: 'list',
            items: [
              'An AI rating waits before its next batch and checks every minute whether the pause is over. If the pause begins during a request, it repeats this batch after the pause. With **Cancel** you can still stop the run during this time.',
              'The outbox waits: emails stay at **AI is writing** and are written after the pause.',
              'Conversations wait: new replies stay at **AI is sorting**, and requested drafts are written after the pause.',
              'The Research autopilot starts no rating. Analysing continues, as it uses no AI.',
              'Sending, campaigns and everything else that needs no AI carry on as normal.',
            ],
          },
          {
            type: 'p',
            text: 'A yellow bar “AI pause” appears at the top of every page, with the end of the pause if known. When a call to the AI runs into the pause, MixMarket creates a notice under **Waiting for you** once per pause and records the start in **Activity** under the area **Controls**. It records the end at the first AI call after the pause.',
          },
          {
            type: 'tip',
            text: 'The AI pause only applies to the subscription selected in the settings, and only if MixMarket can retrieve its usage. If the usage is not available, the AI does not pause.',
          },
        ],
      },
      {
        id: 'key-figures',
        title: 'Key figures',
        blocks: [
          {
            type: 'p',
            text: 'Below the usage, the key figures are shown in a row:',
          },
          {
            type: 'list',
            items: [
              '**Active contacts**: contacts with the status Active, that is everyone you can write to.',
              '**Lists** and **Campaigns**: the number of your lists and campaigns.',
              '**Sent**: the total of successfully sent emails across all campaigns.',
              '**Open rate**: the share of sent campaign emails that were opened at least once.',
              '**Click rate**: the share of sent campaign emails in which at least one link was clicked.',
            ],
          },
          {
            type: 'tip',
            text: 'The figures are based on your campaigns. Follow-up emails from automations and emails from the outbox are not included, and deleted campaigns drop out of the figures.',
          },
          {
            type: 'warning',
            text: 'Opens are counted through an invisible image in the email. Many email programs do not load images, or load them automatically in advance. The open rate is therefore only a rough indication.',
          },
        ],
      },
      {
        id: 'send-timeline',
        title: 'Send activity',
        blocks: [
          {
            type: 'p',
            text: 'The chart **Send activity (30 days)** shows three values per day: **Sent** as a solid line, **Opens** as a dashed line and **Clicks** as a dotted line. Move the mouse over the chart to see the values for a day.',
          },
          {
            type: 'tip',
            text: '**Sent** counts campaign emails. For **Opens** and **Clicks**, every single event counts, including repeated opens and events from follow-up emails and from the outbox. Repeated opens of the same email within one hour count once, and likewise repeated clicks on the same link within one minute.',
          },
        ],
      },
      {
        id: 'quick-actions',
        title: 'Quick actions',
        blocks: [
          {
            type: 'p',
            text: 'Under **Quick actions**, **New campaign**, **Add contact** and **Create template** take you straight to the matching page. There, click the button with the same name at the top right.',
          },
        ],
      },
    ],
  },
  {
    id: 'contacts',
    title: 'Contacts',
    summary: 'Contacts are the recipients of your emails; here you add, edit and import them and see their status.',
    sections: [
      {
        id: 'overview',
        title: 'The contact list',
        blocks: [
          {
            type: 'p',
            text: 'A contact is a person or company with an email address. The table shows email and name, company, sector and status for each contact. The icons for editing and deleting are on the right of each row.',
          },
          {
            type: 'p',
            text: 'The table shows 50 contacts per page, the most recently added first. At the bottom is the number of all contacts matching search and filters. If there is more than one page, you page through with the arrow buttons there, next to a note such as “Page 2 of 5”. You reach older contacts by paging.',
          },
        ],
      },
      {
        id: 'search-filter',
        title: 'Search and filter',
        blocks: [
          {
            type: 'p',
            text: 'The toolbar above the table narrows down the contacts. All settings work together, and after every change the table starts again on the first page.',
          },
          {
            type: 'list',
            items: [
              'The search field searches email address, first name, last name and company.',
              'The buttons **All**, **Active**, **Unsubscribed**, **Bounced** and **Complaint** show only contacts with that status. On a phone you choose the status from a dropdown.',
              'The dropdown **All lists** shows only the contacts of one list. The number of its contacts follows each list name.',
            ],
          },
          {
            type: 'tip',
            text: 'In **Lists**, clicking the contact count of a list takes you straight here, with that list as the filter.',
          },
        ],
      },
      {
        id: 'create',
        title: 'Add a contact',
        blocks: [
          {
            type: 'steps',
            items: [
              'Click **Add contact** at the top right.',
              'Enter the **Email**. It is the only required field and may only exist once.',
              'Fill in **Salutation**, **Title (optional)**, **First name**, **Last name**, **Company**, **Position**, **Country**, **Sector**, **Website** and **Notes** as needed.',
              'Only tick **Consent documented** if you actually have the recipient’s consent.',
              'Under **Add to lists**, choose the lists the contact belongs to.',
              'Click **Save**.',
            ],
          },
          {
            type: 'tip',
            text: 'You can use first name, last name, company, position, country and sector as placeholders in templates. The more complete the contact, the more personal the email.',
          },
          {
            type: 'p',
            text: 'A new contact always starts with the status Active. The **Status** field only appears when editing.',
          },
        ],
      },
      {
        id: 'salutation-title',
        title: 'Salutation and title',
        blocks: [
          {
            type: 'p',
            text: 'From **Salutation**, **Title (optional)** and the name, MixMarket builds the letter greeting for the placeholder {{anrede}}. The template decides the language: in English templates it reads, for example, “Dear Mr Smith” (Templates, The placeholder {{anrede}}). In German templates:',
          },
          {
            type: 'list',
            items: [
              'Salutation **Mr** and a last name: “Sehr geehrter Herr Dr. Muster” (the title only if entered).',
              'Salutation **Ms** and a last name: “Sehr geehrte Frau Dr. Muster”.',
              'Salutation **Not specified** but a last name: “Guten Tag Dr. Erika Muster” with first and last name.',
              'No last name: “Sehr geehrte Damen und Herren”.',
            ],
          },
          {
            type: 'p',
            text: 'When the AI writes to a contact without a salutation in the outbox, it derives the salutation from the first name and MixMarket enters it in the **Salutation** field. For ambiguous first names it stays **Not specified**. You correct a wrong salutation by editing the contact (Outbox, How the AI writes).',
          },
          {
            type: 'tip',
            text: 'Only enter academic titles such as Dr. or Prof. in **Title (optional)**, not job titles.',
          },
        ],
      },
      {
        id: 'edit-delete',
        title: 'Edit and delete',
        blocks: [
          {
            type: 'p',
            text: 'The pencil icon in a row opens the contact for editing. Here you change all fields, the **Status** and the list assignment. The bin icon deletes the contact after a confirmation.',
          },
          {
            type: 'warning',
            text: 'Deleting removes the contact for good. If its address is on the suppression list, that entry stays. If a sequence is running for the contact in the outbox, it ends before the next send at the latest.',
          },
        ],
      },
      {
        id: 'import',
        title: 'Import contacts',
        blocks: [
          {
            type: 'p',
            text: 'With **Import** you add many contacts at once, one line per contact. The order is email, first name, last name, company, separated by commas. Only the email is required.',
          },
          {
            type: 'steps',
            items: [
              'Click **Import** at the top right.',
              'Paste your lines into the text field, for example: max@company.com, Max, Miller, Company Ltd',
              'If needed, choose a list under **Add to list (optional)**. New and existing contacts are then added to this list. With **No list**, the import assigns no list.',
              'Click **Import** at the bottom.',
            ],
          },
          {
            type: 'list',
            items: [
              'New addresses are created as contacts.',
              'If the address already exists, the import only fills empty fields and assigns the chosen list. It never changes the email, status or consent of an existing contact.',
              'If an address appears more than once in the input, it counts only once. Lines without an @ are skipped.',
            ],
          },
          {
            type: 'p',
            text: 'Afterwards MixMarket reports, for example, “12 created, 3 completed, 5 unchanged”. Completed are existing contacts for which the import filled fields or assigned the list. Unchanged are existing contacts without new details, and duplicate lines.',
          },
          {
            type: 'tip',
            text: 'Newly imported contacts have no documented consent. Without a chosen list they are in no list. Assign them in the edit window in that case. Only set consent if you have it.',
          },
        ],
      },
      {
        id: 'status',
        title: 'Contact status',
        blocks: [
          {
            type: 'p',
            text: 'The status shows whether a contact can be written to. Campaigns, follow-up emails and emails from the outbox only go to contacts with the status Active. If a contact is no longer active, their sequence in the outbox ends before the next send at the latest.',
          },
          {
            type: 'list',
            items: [
              '**Active**: can be written to.',
              '**Unsubscribed**: the recipient unsubscribed via the link in an email or asked for no further emails in a reply (Conversations, category Unsubscribe), you set this status, or you suppressed the address under **Suppression** with a reason other than Bounced.',
              '**Bounced**: MixMarket recognised a permanent bounce for this address (Conversations), you set this status, or you suppressed the address with the reason Bounced. With a bounce, only an active contact gets this status; any other status stays.',
              '**Complaint**: you set this status, for example because the recipient complained.',
            ],
          },
          {
            type: 'p',
            text: 'You change the status in the contact’s edit window, in the **Status** field. Unsubscribed, Bounced and Complaint put the address on the suppression list with the matching reason. Active lifts the suppression again.',
          },
          {
            type: 'p',
            text: 'The other way round, the status follows the suppression list: suppress an address under **Suppression** and the contact becomes unsubscribed or bounced. Release it there and the contact becomes active again.',
          },
          {
            type: 'warning',
            text: 'Only set an unsubscribed contact back to Active if the recipient explicitly wants your emails again.',
          },
        ],
      },
      {
        id: 'consent',
        title: 'Consent',
        blocks: [
          {
            type: 'p',
            text: 'The **Consent documented** tick records that you have this recipient’s consent to email advertising. MixMarket does not check this itself; the tick is your own statement.',
          },
          {
            type: 'warning',
            text: 'Only set the tick if you can prove the consent. More on this in the Law and deliverability chapter.',
          },
        ],
      },
      {
        id: 'origin-research',
        title: 'Contacts from research',
        blocks: [
          {
            type: 'p',
            text: 'Contacts you create from prospects in Research via **Add to contacts** or **Contact** are internally given the source “research” and no consent. They are linked to the company from research so that the AI angle can go into your email.',
          },
          {
            type: 'p',
            text: 'Before you send or schedule a campaign, MixMarket tells you how many recipients have no documented consent and how many of them come from research. In the outbox, emails to contacts without consent carry the label **No consent**.',
          },
        ],
      },
    ],
  },
  {
    id: 'lists',
    title: 'Lists',
    summary: 'Lists group contacts together; campaigns are sent to lists.',
    sections: [
      {
        id: 'purpose',
        title: 'What lists are for',
        blocks: [
          {
            type: 'p',
            text: 'A campaign always goes to one or more lists. A contact can be in any number of lists. If they are in several lists of one campaign, they still only get the email once.',
          },
          {
            type: 'p',
            text: 'The **Lists** page shows name, description, type and the number of contacts for each list. Clicking the contact count opens **Contacts** with this list as the filter, so you see at once who is in the list.',
          },
        ],
      },
      {
        id: 'create',
        title: 'Create and edit a list',
        blocks: [
          {
            type: 'steps',
            items: [
              'Click **Create list** at the top right.',
              'Enter a **Name** and, if you like, a **Description**.',
              'Choose the **Type**, usually **Normal**.',
              'Under **Colour (optional)** you can enter a colour value such as #0066ff. The colour appears as a dot in front of the name.',
              'Click **Save**.',
            ],
          },
          {
            type: 'p',
            text: 'Use **Edit** in the row to change a list later.',
          },
        ],
      },
      {
        id: 'assign-contacts',
        title: 'Add contacts to a list',
        blocks: [
          {
            type: 'p',
            text: 'This is how contacts get into a list:',
          },
          {
            type: 'list',
            items: [
              'One by one: open the contact in **Contacts** for editing and tick the lists under **Add to lists**.',
              'When importing: choose the list under **Add to list (optional)**. New and existing contacts are added to it.',
              'From research: contacts you create or link via **Add to contacts** or **Contact** go into the prospect list of their product automatically.',
            ],
          },
        ],
      },
      {
        id: 'list-types',
        title: 'List types',
        blocks: [
          {
            type: 'p',
            text: 'The **Type** (**Normal**, **Unsubscribed**, **Bounced**) is only for orientation and is shown as a coloured badge. MixMarket does not fill these lists automatically. Anyone who must no longer be contacted belongs on the suppression list.',
          },
        ],
      },
      {
        id: 'prospect-lists',
        title: 'Prospect lists per product',
        blocks: [
          {
            type: 'p',
            text: 'The first time you add prospects of a product to the contacts in Research or contact them, MixMarket automatically creates a list named “Interessenten” followed by the product name. Every further transfer for this product goes into the same list.',
          },
          {
            type: 'p',
            text: 'This list is linked to the product. Only through it does the placeholder {{ansatz}} find the AI angle for a contact. So for a campaign using {{ansatz}}, choose the product’s prospect list as a recipient list.',
          },
          {
            type: 'tip',
            text: 'You can rename the prospect list. The link to the product remains.',
          },
        ],
      },
      {
        id: 'delete',
        title: 'Delete a list',
        blocks: [
          {
            type: 'p',
            text: 'The bin icon deletes a list after a confirmation. The contacts in it remain; they only lose their assignment to this list.',
          },
        ],
      },
    ],
  },
  {
    id: 'templates',
    title: 'Templates',
    summary: 'In templates you write the content of your emails and insert placeholders for personal details.',
    sections: [
      {
        id: 'purpose',
        title: 'What templates are for',
        blocks: [
          {
            type: 'p',
            text: 'A template holds the text of an email. Campaigns and automations use a template as their content. The **Templates** page shows name, language (DE or EN), subject and the date of the last change for each template.',
          },
        ],
      },
      {
        id: 'editor',
        title: 'Create and edit a template',
        blocks: [
          {
            type: 'steps',
            items: [
              'Click **Create template** at the top right, or **Edit** on an existing template.',
              'Enter a **Name** and a **Subject**. Both are required and marked with *. If one is missing, MixMarket marks the field in red when you save.',
              'Under **Email language**, choose **German** or **English**. The language sets the greeting {{anrede}}, the unsubscribe note in the footer and the text of the unsubscribe link. New templates and templates from earlier versions are set to **German**.',
              'Write the text in the **HTML content** field. The field expects HTML, for example <p>paragraph</p> for a paragraph and <a href="https://...">link text</a> for a link.',
              'Insert placeholders: clicking a placeholder under **Placeholders** appends it to the end of the text. Then move it to the right place, or type it directly in double curly braces.',
              'Click **Save**.',
            ],
          },
          {
            type: 'tip',
            text: 'Do not write your signature into the template. When sending, MixMarket automatically adds the **Signature** from the settings below the content of every email. If your signature already contains a closing such as “Best regards”, do not write one in the template, otherwise it appears twice.',
          },
          {
            type: 'tip',
            text: 'You write the email text and the subject yourself in the chosen language. MixMarket translates nothing. The **Signature** is the same for all templates.',
          },
        ],
      },
      {
        id: 'packs',
        title: 'Template packs',
        blocks: [
          {
            type: 'tip',
            text: 'Template packs are part of MixMarket Pro. Without Pro, the **Template packs** button shows what the packs can do.',
          },
          {
            type: 'p',
            text: 'Instead of writing yourself, use **Template packs** at the top right to choose what you offer: **Web design agency**, **Marketing agency**, **IT service provider**, **Software vendor**, **Management consultancy**, **Photo and video** or **Commercial cleaning**. **View** shows the content of the pack.',
          },
          {
            type: 'list',
            items: [
              '**Three templates**: first contact, follow-up and meeting request. Clicking a template shows its text. Under **Language** you choose German or English.',
              '**AI hints for personal outreach**: hints for the AI on how to write your first emails in the Outbox. With the tick, the pack sets them for the product selected in Research. If the product already has its own hints, the tick starts off, because the pack would replace them.',
              '**Matching industries for the company search**: one click opens the company search in Research with this industry.',
            ],
          },
          {
            type: 'p',
            text: '**Use pack** creates the three templates, for example “Web design: First contact”. If your signature has no closing line, MixMarket adds “Kind regards” at the end. The pack does not create templates with the same name a second time. Afterwards you edit the templates like any other.',
          },
        ],
      },
      {
        id: 'preview',
        title: 'Preview',
        blocks: [
          {
            type: 'p',
            text: 'Next to the editor, the **Preview** shows how the HTML content is displayed. On narrow screens you switch between the two views with **Editor** and **Preview**.',
          },
          {
            type: 'p',
            text: 'The preview runs in an isolated frame. Scripts and forms in the HTML content have no effect there, and the preview does not load images from external addresses. In the sent email these images appear as usual.',
          },
          {
            type: 'tip',
            text: 'The preview shows placeholders as you wrote them, for example {{anrede}}. They are only replaced when sending. The signature and the footer with postal address and unsubscribe link are also only added when sending.',
          },
        ],
      },
      {
        id: 'placeholders',
        title: 'The placeholders',
        blocks: [
          {
            type: 'p',
            text: 'Placeholders are written in double curly braces and are replaced with each recipient’s data when sending. They work in the template’s HTML content and in the subject of the campaign or automation.',
          },
          {
            type: 'terms',
            items: [
              { term: '{{firstName}}', text: 'The contact’s first name.' },
              { term: '{{lastName}}', text: 'The contact’s last name.' },
              { term: '{{email}}', text: 'The contact’s email address.' },
              { term: '{{company}}', text: 'The contact’s company.' },
              { term: '{{position}}', text: 'The contact’s position.' },
              { term: '{{country}}', text: 'The contact’s country.' },
              { term: '{{sector}}', text: 'The contact’s sector.' },
              { term: '{{anrede}}', text: 'The full letter greeting built from salutation, title and name in the template language, for example “Sehr geehrte Frau Dr. Muster” or “Dear Ms Miller”.' },
              { term: '{{ansatz}}', text: 'The AI angle for the first contact, matching the product of the prospect list.' },
            ],
          },
          {
            type: 'list',
            items: [
              'If a field is empty for a contact, nothing appears in its place.',
              'A misspelt placeholder is not replaced and appears unchanged in the email. Check the spelling carefully, including upper and lower case.',
              'In the HTML content, MixMarket inserts the values as plain text. If a contact field or the angle contains HTML, such as a link, it appears in the email as visible text and is not executed.',
              'In the subject, MixMarket removes line breaks from the inserted values and puts a space in their place.',
            ],
          },
        ],
      },
      {
        id: 'placeholder-anrede',
        title: 'The placeholder {{anrede}}',
        blocks: [
          {
            type: 'p',
            text: '{{anrede}} inserts the matching letter greeting in the **Email language** of the template. MixMarket builds it from the contact’s **Salutation**, **Title (optional)**, **First name** and **Last name**. In German templates:',
          },
          {
            type: 'list',
            items: [
              'Mr with a last name: “Sehr geehrter Herr Muster”, with a title “Sehr geehrter Herr Dr. Muster”.',
              'Ms with a last name: “Sehr geehrte Frau Muster”.',
              'No salutation but a last name: “Guten Tag Erika Muster”.',
              'No last name: “Sehr geehrte Damen und Herren”.',
            ],
          },
          {
            type: 'p',
            text: 'In English templates:',
          },
          {
            type: 'list',
            items: [
              'Mr with a last name: “Dear Mr Smith”.',
              'Ms with a last name: “Dear Ms Miller”.',
              'A title and a last name, with or without salutation: “Dear Dr. Smith”. The title then replaces Mr or Ms.',
              'No salutation but a last name: “Dear John Smith”.',
              'No last name: “Dear Sir or Madam”.',
            ],
          },
          {
            type: 'tip',
            text: 'The greeting ends without punctuation. Add the comma yourself directly after {{anrede}}. In German templates, start the next line in lower case, as is usual in German letters.',
          },
          {
            type: 'p',
            text: 'For contacts from research, salutation and name come from the company’s chosen contact person. If none is known, the greeting is “Sehr geehrte Damen und Herren”, or “Dear Sir or Madam” in English templates.',
          },
        ],
      },
      {
        id: 'placeholder-ansatz',
        title: 'The placeholder {{ansatz}}',
        blocks: [
          {
            type: 'p',
            text: '{{ansatz}} inserts the angle the AI suggested when rating a company: one or two factual sentences that link a specific detail of the company to your product, without greeting or sign-off. The AI always writes these angles in German, also for templates in English. It is therefore best not to use {{ansatz}} in English templates.',
          },
          {
            type: 'p',
            text: 'For {{ansatz}} to be filled, all of these conditions must be met:',
          },
          {
            type: 'list',
            items: [
              'The contact was created from prospects via **Add to contacts**, or linked to the company that way.',
              'The contact is in the product’s prospect list, and exactly this list is a recipient list of the campaign.',
              'The company was rated by the AI for this product and has a fit above 3. For 1 to 3 the AI writes no angle.',
            ],
          },
          {
            type: 'p',
            text: 'If the angle is missing, the spot stays empty. That is why MixMarket shows, before sending and when scheduling, how many recipients have no angle.',
          },
          {
            type: 'tip',
            text: 'Write the sentence around {{ansatz}} so that the email still makes sense without it. You can check a company’s angle in its detail view and take it with **Copy**.',
          },
          {
            type: 'warning',
            text: 'If you change the product description, ideal customer or minimum size, the ratings count as outdated. {{ansatz}} keeps using the previous angle until you rate the companies again.',
          },
        ],
      },
      {
        id: 'footer-tracking',
        title: 'What is added when sending',
        blocks: [
          {
            type: 'list',
            items: [
              'Below the content, MixMarket places your **Signature** from the settings, if one is entered there.',
              'MixMarket appends a footer to every email: your postal address from the settings with its line breaks, plus the unsubscribe note and unsubscribe link in the **Email language** of the template. For German these are the **Unsubscribe note German** and the link “Hier abmelden”, for English the **Unsubscribe note English** and the link “Unsubscribe here”.',
              'Links in content and signature that start with http or https are redirected through MixMarket so that clicks are counted. The recipient then lands on the original page.',
              'An invisible image counts whether the email was opened.',
              'In addition, MixMarket automatically creates a plain text version from the HTML, with content, signature, postal address and unsubscribe link in the same language, and sends it along. This improves deliverability.',
            ],
          },
        ],
      },
      {
        id: 'subject-note',
        title: 'Template subject',
        blocks: [
          {
            type: 'p',
            text: 'The template’s **Subject** is a suggestion. If you choose a template in a campaign while the campaign subject is empty, MixMarket copies the template subject into the field. The subject of the campaign or automation is always the one sent. In an automation you enter the subject yourself.',
          },
        ],
      },
      {
        id: 'delete',
        title: 'Delete a template',
        blocks: [
          {
            type: 'p',
            text: 'The bin icon in the row deletes a template after a confirmation.',
          },
        ],
      },
    ],
  },
  {
    id: 'campaigns',
    title: 'Campaigns',
    summary: 'A campaign sends a template to the contacts of selected lists, either now or at a scheduled time.',
    sections: [
      {
        id: 'purpose',
        title: 'The campaign list',
        blocks: [
          {
            type: 'p',
            text: 'The **Campaigns** page shows name and subject, status and figures for each campaign, with the buttons that fit the status on the right.',
          },
        ],
      },
      {
        id: 'create',
        title: 'Create a campaign',
        blocks: [
          {
            type: 'steps',
            items: [
              'Click **New campaign** at the top right.',
              'Enter **Campaign name** and **Subject**. The subject may contain placeholders, for example {{company}}.',
              'Check **Sender name** and **Sender address**. For a new campaign, both are pre-filled from your mailbox in the settings. Ideally, use your mailbox’s address as the sender address.',
              'Under **Template**, choose the content of the email. If the subject is still empty, MixMarket copies the template subject.',
              'Under **Lists**, tick every list whose contacts should get the email. The number of contacts is shown next to each list.',
              'Leave **Scheduled for** empty to save the campaign as a draft. If you choose a date and time, the campaign is scheduled when you save and sent automatically at that time.',
              'Click **Save**.',
            ],
          },
          {
            type: 'list',
            items: [
              'Required fields are marked with *: **Campaign name**, **Subject**, **Sender name** and **Sender address**. If one is missing or the sender address is invalid, MixMarket marks the field in red and reports “Please fill in the required fields marked in red.”',
              'The **Template** is required for sending and scheduling, as the hint below the field says. You can save a draft without a template.',
              'A time under **Scheduled for** needs a template and must be in the future. Otherwise MixMarket does not save and reports the reason.',
            ],
          },
        ],
      },
      {
        id: 'recipients',
        title: 'Who gets the email',
        blocks: [
          {
            type: 'p',
            text: 'Recipients are all contacts in the chosen lists who have the status Active and are not on the suppression list. Each contact gets the email only once, even if they are in several lists. Recipients are only determined at the moment of sending.',
          },
        ],
      },
      {
        id: 'send-now',
        title: 'Send now',
        blocks: [
          {
            type: 'steps',
            items: [
              'In the row of a draft, click **Send now**.',
              'MixMarket shows how many recipients the campaign will go to, with any warnings below.',
              'Confirm with **Send now** or cancel.',
            ],
          },
          {
            type: 'p',
            text: 'If the campaign has no template, or the chosen lists contain no recipients that may be emailed, MixMarket refuses to send and shows a message. If the emergency stop is active, MixMarket refuses to send with the message “Sending is stopped by the emergency stop.” (Overview, Emergency stop).',
          },
          {
            type: 'p',
            text: 'Sending runs in the background. MixMarket waits briefly between two emails so that your mailbox does not look like a bulk sender. Meanwhile the status is **Sending**.',
          },
        ],
      },
      {
        id: 'schedule',
        title: 'Schedule sending',
        blocks: [
          {
            type: 'steps',
            items: [
              'In the row of a draft, click **Schedule**.',
              'Under **Scheduled for**, choose date and time and click **Apply**. Times in the past are not possible.',
              'Read any warnings that appear and click **Schedule**.',
            ],
          },
          {
            type: 'p',
            text: 'The campaign then shows **Scheduled** with the time below. MixMarket checks every minute whether a scheduled campaign is due and then starts sending. During an emergency stop, a due campaign stays scheduled and starts once sending is released.',
          },
          {
            type: 'p',
            text: 'Without a template or without permitted recipients, MixMarket refuses to schedule and shows a message.',
          },
          {
            type: 'tip',
            text: 'You can also enter a time under **Scheduled for** in the edit window. When you save, the campaign is first stored as a draft; then MixMarket checks the recipients as with the **Schedule** button, shows the warnings and asks whether to schedule. If you decline, the campaign stays a draft.',
          },
          {
            type: 'p',
            text: 'To stop a scheduled campaign, click **Unschedule** in its row. After a confirmation it becomes a draft again. You can then edit it, send it now or schedule it again.',
          },
        ],
      },
      {
        id: 'warnings',
        title: 'Warnings before sending',
        blocks: [
          {
            type: 'p',
            text: 'Before sending and in the scheduling window, MixMarket checks the recipients and your settings and shows these warnings when needed:',
          },
          {
            type: 'list',
            items: [
              'Missing consent: how many recipients have no documented consent, wherever they come from, and how many of them come from research.',
              'Missing angle: if the template or subject uses {{ansatz}}, MixMarket shows how many recipients have no angle. For them the spot stays empty.',
              'Missing postal address: no **Postal address (required in footer)** is entered in the settings. It belongs in the footer of every email.',
            ],
          },
          {
            type: 'p',
            text: 'The warnings do not block sending. You decide whether to go ahead. Sending and scheduling are only blocked without a template or without permitted recipients.',
          },
        ],
      },
      {
        id: 'status',
        title: 'Campaign status',
        blocks: [
          {
            type: 'terms',
            items: [
              { term: 'Draft', text: 'Created, not sent yet. You can edit, send, schedule and delete it.' },
              { term: 'Scheduled', text: 'Waiting for the chosen time. You can unschedule or delete it.' },
              { term: 'Sending', text: 'Sending is in progress.' },
              { term: 'Sent', text: 'Sending is complete.' },
              { term: 'Paused', text: 'Sending was interrupted, for example by an error, a server restart or the emergency stop. You can continue it with **Resume** or delete the campaign.' },
              { term: 'Cancelled', text: 'Only exists for older campaigns that were stopped in the past. MixMarket no longer assigns this status. You edit, send, schedule and delete a cancelled campaign like a draft.' },
            ],
          },
        ],
      },
      {
        id: 'paused-resume',
        title: 'Paused and resume',
        blocks: [
          {
            type: 'p',
            text: 'If sending stops with an error, the server is shut down while sending, or you trigger the emergency stop, MixMarket sets the campaign to **Paused**. What exactly happened is recorded in **Activity**. Paused campaigns also appear under **Waiting for you** on the Overview.',
          },
          {
            type: 'steps',
            items: [
              'Fix the cause, for example wrong mailbox access details. After an emergency stop, release sending again on the Overview with **Release sending**. A paused campaign does not continue by itself afterwards.',
              'Click **Resume** in the row. As with sending, MixMarket shows any warnings first. Confirm with **Resume**.',
            ],
          },
          {
            type: 'p',
            text: 'Emails that were already sent are not sent again. Emails that failed before are tried once more.',
          },
        ],
      },
      {
        id: 'metrics',
        title: 'Figures',
        blocks: [
          {
            type: 'p',
            text: 'Each campaign shows three numbers: how many emails were sent, how many recipients opened the email and how many clicked at least one link. Opens and clicks count only once per recipient.',
          },
          {
            type: 'tip',
            text: 'Opens are imprecise because many email programs block images or load them automatically. Clicks are more reliable.',
          },
        ],
      },
      {
        id: 'edit-delete',
        title: 'Edit and delete',
        blocks: [
          {
            type: 'p',
            text: 'You edit drafts and older cancelled campaigns with the pencil icon in the row. You edit a scheduled campaign after unscheduling it. The bin icon deletes a campaign in any status after a confirmation.',
          },
          {
            type: 'warning',
            text: 'When you delete a campaign, its figures also disappear from the Overview. If it is the source campaign of an active automation, MixMarket pauses that automation automatically and records this in **Activity**.',
          },
        ],
      },
      {
        id: 'replies',
        title: 'Replies and bounces',
        blocks: [
          {
            type: 'p',
            text: 'If receiving (IMAP) is set up, replies to campaign emails end up in **Conversations**. MixMarket recognises them by the email thread, and replies to follow-up emails from automations by the contact’s address. In the conversation thread, the campaign appears with name and subject (Conversations).',
          },
          {
            type: 'list',
            items: [
              'With the Replies autopilot switched on, the AI sorts every reply. With the category Unsubscribe, the address goes on the suppression list and the contact gets the status Unsubscribed.',
              'If a campaign email comes back as permanently undeliverable, MixMarket puts the address on the suppression list with the reason Bounced, an active contact gets the status Bounced, and the send to this address counts as bounced in the campaign. Later campaigns leave the address out.',
              'Too many permanent bounces in 24 hours trigger the automatic emergency stop (Overview, Emergency stop).',
              'You find bounces in **Conversations** in the **Undeliverable** view.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'automations',
    title: 'Automations',
    summary: 'Automations send a follow-up email depending on how recipients reacted to a campaign.',
    sections: [
      {
        id: 'purpose',
        title: 'What automations are for',
        blocks: [
          {
            type: 'tip',
            text: 'Automations are part of MixMarket Pro. Without Pro, the **Automations** page only shows what they can do.',
          },
          {
            type: 'p',
            text: 'An automation watches the campaign emails sent after it was created. When the chosen trigger applies, the recipient gets a follow-up email with its own template after the set delay. Each contact gets at most one follow-up email per automation.',
          },
          {
            type: 'p',
            text: 'The list shows trigger, delay, template, source campaign, the number of runs so far, and whether the automation is **Active** or **Paused**.',
          },
        ],
      },
      {
        id: 'create',
        title: 'Create an automation',
        blocks: [
          {
            type: 'steps',
            items: [
              'Click **Create automation** at the top right.',
              'Enter a **Name**.',
              'Choose the **Trigger**.',
              'Under **Delay (days)**, enter how many days after the original email the follow-up should be sent.',
              'Choose the **Source campaign**, or keep **All campaigns**.',
              'Choose the **Template** of the follow-up email.',
              'Enter **Subject**, **Sender name** and **Sender address**.',
              'Click **Save**. A new automation is active straight away.',
            ],
          },
          {
            type: 'p',
            text: 'Required fields are marked with *: **Name**, **Template**, **Subject**, **Sender name** and **Sender address**. If one is missing or the sender address is invalid, MixMarket marks the field in red and does not save.',
          },
        ],
      },
      {
        id: 'triggers',
        title: 'Triggers',
        blocks: [
          {
            type: 'terms',
            items: [
              { term: 'Clicked', text: 'The recipient clicked at least one link in the campaign email.' },
              { term: 'Opened', text: 'The campaign email was counted as opened.' },
              { term: 'Did not open', text: 'The campaign email is still unopened when the delay has passed.' },
            ],
          },
          {
            type: 'p',
            text: 'MixMarket checks every minute. With **Clicked** and **Opened**, it queues a recipient as soon as the trigger applies. With **Did not open**, MixMarket waits for the delay and only then checks whether the email is still unopened. Only then is the follow-up sent.',
          },
          {
            type: 'tip',
            text: 'Opens are not always detected, because many email programs block images. With **Did not open**, someone who read the email may therefore still get a follow-up.',
          },
        ],
      },
      {
        id: 'delay',
        title: 'Delay',
        blocks: [
          {
            type: 'p',
            text: 'The delay counts from when the original campaign email was sent, not from the click or open. 0 to 60 days are allowed. If the time has already passed, the follow-up goes out at the next check. With **Did not open**, the delay is also the waiting time after which MixMarket checks whether the email is still unopened.',
          },
        ],
      },
      {
        id: 'source-campaign',
        title: 'Source campaign',
        blocks: [
          {
            type: 'p',
            text: 'With a **Source campaign**, the automation only applies to emails of that one campaign. Without one, it applies to all campaigns.',
          },
          {
            type: 'p',
            text: 'In both cases, only campaign emails sent after the automation was created trigger follow-ups. Older sends are not taken into account.',
          },
          {
            type: 'warning',
            text: 'If you delete the source campaign, MixMarket pauses the automation automatically and records this in **Activity**. It then has no source campaign any more. If you activate it again, it applies to all campaigns. So choose a new source campaign under **Edit** first.',
          },
          {
            type: 'p',
            text: 'For {{ansatz}}, MixMarket looks for the angle in the lists of the source campaign, or in all of the contact’s lists if there is no source campaign.',
          },
        ],
      },
      {
        id: 'pause-edit',
        title: 'Pause, edit, delete',
        blocks: [
          {
            type: 'list',
            items: [
              'The power icon in the row switches an automation between **Active** and **Paused**. For screen readers it is called **Pause** while the automation is active and **Activate** while it is paused.',
              '**Edit** opens the automation’s settings.',
              'The bin icon deletes the automation after a confirmation.',
            ],
          },
          {
            type: 'p',
            text: 'A paused automation sends nothing and queues no new recipients. Follow-ups that are already queued wait until you activate it again. If their time has passed by then, they go out at the next check.',
          },
          {
            type: 'warning',
            text: 'After you activate it again, the automation also takes into account campaign emails sent during the pause. If no more follow-ups should be sent at all, delete the automation.',
          },
        ],
      },
      {
        id: 'how-it-runs',
        title: 'What is checked before a follow-up',
        blocks: [
          {
            type: 'list',
            items: [
              'If the contact is no longer active or is on the suppression list, the follow-up is skipped.',
              'Like campaigns, follow-up emails get your signature, the footer with postal address and unsubscribe link, and an automatic plain text version. Greeting, unsubscribe note and unsubscribe link text follow the **Email language** of the template chosen in the automation. Unsubscribing via the link or the email program’s unsubscribe button works the same way.',
              'How many follow-ups were sent or failed is recorded in **Activity**.',
              'During an emergency stop, no automation sends a follow-up email. It still queues new recipients, and due follow-ups go out once sending is released (Overview, Emergency stop).',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'research',
    title: 'Research',
    summary: 'In Research you find companies, analyse their websites, build target groups, have them rated by the AI and manage your prospects.',
    sections: [
      {
        id: 'overview',
        title: 'How Research is organised',
        blocks: [
          {
            type: 'p',
            text: 'Research has four tabs. On a phone you pick them from a dropdown. MixMarket remembers which tab you had open last.',
          },
          {
            type: 'terms',
            items: [
              { term: 'Find companies', text: 'Search for companies of one trade in a region and analyse their websites.' },
              { term: 'Target groups', text: 'Build a selection from all companies found, using signals, and rate it with the AI.' },
              { term: 'Prospects', text: 'Your working list per product: companies you want to approach, with status and note. From here you also contact them through the outbox.' },
              { term: 'Read web pages', text: 'Read individual web pages for email addresses or your own fields.' },
            ],
          },
          {
            type: 'p',
            text: 'In the first three tabs, **Finding customers for** at the top lets you choose the product. Target groups, AI ratings and prospects always refer to the product chosen here.',
          },
        ],
      },
      {
        id: 'products',
        title: 'Manage products',
        blocks: [
          {
            type: 'p',
            text: 'A product is what you want to sell. Each product gets its own target groups, and the AI rates companies separately for each product.',
          },
          {
            type: 'steps',
            items: [
              'In Research, click **Manage products** at the top, or **Create first product** the very first time.',
              'Click **New product**.',
              'Enter a **Name** and, if you like, the **Website (optional)**.',
              'Under **What you sell**, describe the product: key features, prices and who it is for. Facts only; the AI uses them in the angles.',
              'Under **Your ideal customer**, describe which businesses fit especially well and which do not. The AI rates the fit on this basis.',
              'If needed, enter the **Minimum customer size (optional)**.',
              'Click **Save**.',
            ],
          },
          {
            type: 'tip',
            text: 'Both descriptions need at least one full sentence. The more precisely you describe the ideal customer, the more accurate the fit and the angles.',
          },
          {
            type: 'p',
            text: 'The product list shows the number of target groups and rated companies for each product. That is where you edit or delete products.',
          },
          {
            type: 'warning',
            text: 'When you delete a product, its AI ratings and its prospects are deleted too, and so are its emails in the outbox. The confirmation names how many there are of each. Target groups and the prospect list with its contacts remain, without a product.',
          },
        ],
      },
      {
        id: 'min-size',
        title: 'Minimum size',
        blocks: [
          {
            type: 'p',
            text: 'The **Minimum customer size (optional)** is the number of employees from which your product makes sense. Companies that are clearly smaller get an AI score of 3 at most. If the size is unclear, the AI rates cautiously. Leave the field empty if size does not matter.',
          },
          {
            type: 'p',
            text: 'MixMarket determines a company’s size from a headcount stated on its website, otherwise from the AI’s estimate, otherwise from indicators such as departments, locations or open positions.',
          },
          {
            type: 'warning',
            text: 'If you change the description, ideal customer or minimum size, the existing ratings for this product count as outdated. Rate the companies again in that case.',
          },
        ],
      },
      {
        id: 'find-companies',
        title: 'Find companies',
        blocks: [
          {
            type: 'steps',
            items: [
              'Open the **Find companies** tab and click **New search** at the top right.',
              'Under **Source**, choose the search source. On the right it says whether it is **free**, **Set up** or without access (**No access**).',
              'Under **Trade**, choose an entry from the list. Below, **Searching for** shows the search term MixMarket uses. For your own term, choose **Custom search term** and type it under **Search term**.',
              'Under **Place**, enter a town or postcode.',
              'Depending on the source, choose **Radius** and **Maximum**, or the **Search depth**. **Maximum** sets how many companies the search returns at most, for example **100 companies**. It has nothing to do with distance, which you set under **Radius**.',
              'Check the **Estimated cost** at the bottom and click **Start search**. If the search costs money, confirm the amount once more.',
            ],
          },
          {
            type: 'list',
            items: [
              'Only one search runs at a time. Start the next one when the current one is done.',
              'If the chosen source has no access yet, the link **Enter access in settings** takes you straight to the research access settings.',
              'If the estimated cost is above your cost limit per search, the search does not start. You change the limit in the settings.',
            ],
          },
        ],
      },
      {
        id: 'sources-costs',
        title: 'Sources and costs',
        blocks: [
          {
            type: 'tip',
            text: 'DataForSEO and Serper are part of MixMarket Pro. Without Pro, MixMarket searches via OpenStreetMap, free of charge.',
          },
          {
            type: 'terms',
            items: [
              {
                term: 'OpenStreetMap',
                text: 'Open map data, free and without an account. Good for practices, shops and restaurants, patchy for trades without premises. Only searches trades from the list, not custom search terms. You set radius and maximum number.',
              },
              {
                term: 'DataForSEO business listings',
                text: 'Google business profiles within a radius, with phone, website and rating. About 0.37 USD per 1,000 companies. You set radius and maximum number.',
              },
              {
                term: 'DataForSEO Google search',
                text: 'Who ranks on Google for trade and place, with position. 0.002 USD per 10 results. You set the search depth.',
              },
              {
                term: 'Serper Google search',
                text: 'Google search with position. 2,500 queries free, then up to about 1 USD per 1,000 queries. You set the search depth.',
              },
            ],
          },
          {
            type: 'p',
            text: 'The listing sources search within the radius around the place. The search engine sources search for term and place and keep the ranking position. Positions 11 to 30 are often companies that want to be visible but are not there yet.',
          },
          {
            type: 'tip',
            text: 'The cost estimate appears as soon as a trade or search term is chosen. After the search, its row shows the actual cost.',
          },
        ],
      },
      {
        id: 'search-results',
        title: 'Search results',
        blocks: [
          {
            type: 'p',
            text: 'Each search appears as a row with trade or search term, place, source, cost, date and status. When it is done, it shows for example “12 new, 3 known, 4 filtered”:',
          },
          {
            type: 'list',
            items: [
              'new: companies MixMarket found for the first time.',
              'known: companies already known from an earlier search. They are not created twice; missing details are added.',
              'filtered: directories and portals that are not real businesses.',
            ],
          },
          {
            type: 'p',
            text: 'While a search is running, the row shows “Search running. With OpenStreetMap this can take up to a minute under load.” If OpenStreetMap is under heavy load, MixMarket waits longer for the answer and tries again before it reports an error.',
          },
          {
            type: 'p',
            text: 'If a search fails, the error message appears below the search, together with the button **Search again**. It repeats the search with the same details. Here too, only one search runs at a time, the access for the source must be entered, and the estimated cost must not exceed the cost limit per search.',
          },
          {
            type: 'p',
            text: 'The button with the number of companies opens the list of companies found. The table shows **Company** with address, **Contact person**, **Contact**, **Website** and **Signals**, depending on the source also **Rank** and **Rating**, and after an AI rating the **Fit**. Click a company name to open the detail view.',
          },
          {
            type: 'warning',
            text: 'When you delete a search, companies found only by that search are deleted too, along with their ratings, prospect entries and emails in the outbox.',
          },
        ],
      },
      {
        id: 'profiling',
        title: 'Analyse',
        blocks: [
          {
            type: 'p',
            text: 'Analysing means that MixMarket loads the public pages of a company website, namely home page, legal notice, contact, careers, team, robots.txt and sitemap, and extracts contact persons, email addresses and signals from them. This costs nothing and uses no AI.',
          },
          {
            type: 'steps',
            items: [
              'In the row of a finished search, click **Analyse companies**.',
              'The progress appears below the search. You can keep working meanwhile.',
              'Afterwards the row shows how many websites were analysed. **Analyse again** repeats the process.',
            ],
          },
          {
            type: 'list',
            items: [
              'Only companies with a known website are analysed.',
              'MixMarket respects a website’s robots.txt and does not fetch blocked pages. It makes at most 14 requests per company, one after another with a short pause.',
              'MixMarket never fetches addresses in your own network, such as localhost or private IP addresses. It checks the address it actually connects to, also after every redirect.',
              'Only one search is analysed at a time.',
              'You analyse a single company in its detail view with **Analyse** or **Analyse again**.',
              'With the Research autopilot switched on, MixMarket analyses finished searches that have never been analysed by itself, one after another (Overview, Autopilot).',
            ],
          },
          {
            type: 'tip',
            text: 'Google or Meta ads are only detected when they load with the page. If they only load after cookie consent, “No” is shown.',
          },
        ],
      },
      {
        id: 'company-detail',
        title: 'Company detail view',
        blocks: [
          {
            type: 'p',
            text: 'Clicking a company name in any company list in Research opens the detail view. At the top it says when the company was analysed, next to the buttons **Add as prospect** and **Analyse** or **Analyse again**. If the company is already a prospect for the chosen product, its status is shown there instead.',
          },
          {
            type: 'list',
            items: [
              'AI rating for the chosen product: fit from 1 to 10, reasoning and the **Angle for the first contact** with the **Copy** button. If the rating is outdated, a note is shown next to it.',
              '**Ratings for other products**: fit and reasoning for your other products.',
              '**Contact persons**: names from the legal notice and team page with their role. **Decision maker** marks managing directors, owners and similar roles.',
              '**Contact and company**: address, phone, personal or general email, legal notice, legal form, commercial register, VAT ID and size indicators.',
              '**Website**: system, built by, ads, online booking, contact form, mobile friendliness, HTTPS, structured data, copyright year, last change, number of pages, social networks and other technology.',
              '**Open positions**: job ads found, or a note about a career page.',
            ],
          },
          {
            type: 'tip',
            text: 'The small arrow icon after a detail opens the source page, that is the page where MixMarket found the detail.',
          },
        ],
      },
      {
        id: 'target-groups',
        title: 'Build target groups',
        blocks: [
          {
            type: 'p',
            text: 'In the **Target groups** tab you put together a selection from the companies found. The number of matching companies updates instantly with every change.',
          },
          {
            type: 'steps',
            items: [
              'Under **Scope**, choose **All companies** or **Selected searches**, and then tick the searches you want.',
              'For each signal, set whether it is **any**, **must** apply or must **not** apply.',
              'On the right you see the number of matching companies out of the total. Below, the **Matching companies** are listed, rated companies with the highest fit first.',
              'To keep the selection, enter a **Target group name** and click **Save**. The summary of the chosen signals sits directly above the field, so you can check what the target group contains before saving.',
            ],
          },
          {
            type: 'list',
            items: [
              'Saved target groups are listed on the right under **Saved target groups** with the current number of matching companies. Click one to load it.',
              'Change a loaded target group and store it with **Save changes**, or remove it with **Delete**. The companies remain either way.',
              '**New target group** at the top right resets all signals.',
              'A target group belongs to the product that was chosen when saving. Target groups without a product are marked **no product**.',
            ],
          },
          {
            type: 'tip',
            text: 'The table shows at most the first 200 matching companies. All of them are still counted, rated and added.',
          },
        ],
      },
      {
        id: 'signals',
        title: 'Signals',
        blocks: [
          {
            type: 'p',
            text: 'Signals are properties of a company that MixMarket knows from the search, from analysing or from the AI rating. They are grouped into **Contact**, **Website**, **Company**, **Search and Google profile** and **AI rating**.',
          },
          {
            type: 'p',
            text: 'For most signals, a line below shows how many companies in the chosen scope have yes, no or unknown. This helps when building the group.',
          },
          {
            type: 'list',
            items: [
              'If a signal is unknown, for example because the company has not been analysed yet, it counts neither for **must** nor for **not**. So analyse the companies before filtering.',
              'For **Website system** and **Legal form** you also choose a value. With **any**, it is enough that some value is known.',
              'For **AI fit** you choose a lower limit from at least 5 to 9. Without a choice, **from 7 (default)** applies.',
              'For **Estimated size** you choose a minimum number of employees between 5 and 250. Without a choice, **from 20 employees (default)** applies.',
            ],
          },
          {
            type: 'p',
            text: 'If no company meets all signals, set some signals back to **any**.',
          },
        ],
      },
      {
        id: 'ai-rating',
        title: 'AI rating',
        blocks: [
          {
            type: 'p',
            text: 'The AI rates companies by how well they fit the chosen product. It works with the details from analysing and with your product description. It requires an AI subscription chosen and saved in the settings.',
          },
          {
            type: 'steps',
            items: [
              'Choose the product at the top and, in the **Target groups** tab, set up the selection to be rated.',
              'In the box **AI rating for** your product on the right, click **Rate with AI**.',
              'The progress appears in the box. **Cancel** stops the run after the current request.',
              'When the run is finished, the fit appears in the company lists and in the detail view.',
            ],
          },
          {
            type: 'list',
            items: [
              'Only analysed companies in the selection are rated, five per request to the AI. When starting, MixMarket reports how many are not analysed yet.',
              'Companies with a current rating are skipped. With the tick **Rate already rated again**, the AI rates those again too.',
              'Only one AI rating runs at a time. The result of the last run is shown in the box.',
              'The AI gets no tools and cannot run anything on your computer.',
              'With the Research autopilot switched on, MixMarket rates saved target groups with a product by itself, namely the companies without a current rating. While a rating is running, it starts no further one (Overview, Autopilot).',
              'During an AI pause, a rating waits before its next batch until the subscription is below the limit again, and then continues. With **Cancel** you can still stop it during this time (Overview, AI pause).',
            ],
          },
          {
            type: 'tip',
            text: 'The **AI settings** link in the box takes you to the AI rating settings.',
          },
        ],
      },
      {
        id: 'fit-and-hook',
        title: 'Fit and angle',
        blocks: [
          {
            type: 'terms',
            items: [
              {
                term: 'Fit',
                text: 'A whole number from 1 (does not fit at all) to 10 (ideal fit), with a short reasoning. Values of 7 and above and values up to 3 are highlighted in colour. Companies that clearly do not belong to the target group get 1 to 3.',
              },
              {
                term: 'Angle',
                text: 'One or two sentences for a first personal approach. The AI picks up a specific detail of the company and links it factually to your product, in formal German, without greeting or sign-off. With a fit of 1 to 3 there is no angle.',
              },
            ],
          },
          {
            type: 'p',
            text: 'The AI also estimates the company’s number of employees. This estimate feeds into the signal **Estimated size**.',
          },
          {
            type: 'warning',
            text: 'The AI may only use facts from the collected details, but it can be wrong. Spot-check the angles before sending.',
          },
        ],
      },
      {
        id: 'prospects',
        title: 'Prospects',
        blocks: [
          {
            type: 'p',
            text: 'Prospects are companies you want to approach for the chosen product. The **Prospects** tab is your working list, highest fit first.',
          },
          {
            type: 'p',
            text: 'This is how you add companies:',
          },
          {
            type: 'list',
            items: [
              'From a target group: in the box **Prospects for** your product, choose **All companies** or a lower limit such as **Fit from 7** and click **Add**. Existing prospects are skipped, as are companies below the limit or without a rating.',
              'One by one: click **Add as prospect** in a company’s detail view.',
              'Automatically: with the Writing autopilot switched on, MixMarket adds companies of saved target groups from the minimum fit by itself and puts them into the outbox (Overview, Autopilot).',
            ],
          },
          {
            type: 'p',
            text: 'Each row shows fit and company name, trade and town, the AI angle, contact person, phone, email and website, and your note. **In contacts** shows that the prospect has already been added as a contact, **personal** marks a personal email address.',
          },
          {
            type: 'p',
            text: 'If the prospect is in the outbox, the row shows a link with the state of its latest email, for example “Outbox: To approve” or, after sending, “Outbox: email 1 sent”. Clicking it opens the **Outbox**.',
          },
          {
            type: 'p',
            text: 'The status records where you stand:',
          },
          {
            type: 'terms',
            items: [
              { term: 'New', text: 'Added, not approached yet.' },
              { term: 'Contacted', text: 'You have written to or called the company. After the first email from the outbox has been sent, MixMarket sets this status itself.' },
              { term: 'In talks', text: 'There is an exchange going on. When a reply arrives in **Conversations**, MixMarket sets a prospect with the status New or Contacted to this status itself. A running sequence in the outbox ends.' },
              { term: 'Not interested', text: 'The company does not want to. If a contact unsubscribes via the link in an email, MixMarket sets their prospects to this status automatically, as well as the prospect of a reply with the category Not interested or Unsubscribe (Conversations). **Add to contacts** does not move prospects with this status. A running sequence in the outbox ends.' },
              { term: 'Customer', text: 'The company has become a customer. A running sequence in the outbox ends.' },
            ],
          },
          {
            type: 'list',
            items: [
              'Change the status directly in the dropdown on the right of the row. MixMarket does not change it by itself when you send a campaign. Incoming replies do change it, as described above.',
              'The bar above the list filters by status and shows the count per status.',
              '**Edit** opens the window **Edit prospect** with **Contact person**, **Status** and **Note**. Under **Contact person** you choose whom to approach; **Automatic: first decision maker** takes the first decision maker found.',
              'The bin icon removes the prospect. Company and contact remain; its emails in the outbox are removed with it.',
            ],
          },
          {
            type: 'p',
            text: 'Personal emails: **Contact** in a row hands the prospect over to the outbox, **Contact new** at the top right does so for all prospects of the product that can be contacted. These are prospects with the status New and a known email address that are not yet in the outbox. Only they show the **Contact** button. The AI then writes a first email for each company, which you check and approve in the outbox (Outbox, Contact prospects).',
          },
        ],
      },
      {
        id: 'prospects-to-contacts',
        title: 'Add prospects to contacts',
        blocks: [
          {
            type: 'p',
            text: 'To write to prospects with a campaign, add them to the contacts. The outbox does not need this step: **Contact** creates missing contacts itself in the same way.',
          },
          {
            type: 'steps',
            items: [
              'Open the **Prospects** tab and check that the right product is chosen at the top.',
              'Click **Add to contacts** at the top right.',
              'Read the notes in the window and confirm.',
            ],
          },
          {
            type: 'list',
            items: [
              'All prospects of the product with an email address are added, except those with the status **Not interested**. A separate message says how many were not moved for this reason.',
              'As the address, MixMarket takes the personal address of the chosen contact person if it clearly belongs to them, otherwise the company’s general address.',
              'Salutation, title and name come from the contact person; trade, company and website from the company.',
              'New contacts get the source “research” and no consent. A notice about this appears before a campaign is sent.',
              'Existing contacts are only linked, not created twice. Addresses on the suppression list are skipped.',
              'All added contacts go into the product’s prospect list. Prospects without an email stay in the prospect tab, for example for a call.',
            ],
          },
        ],
      },
      {
        id: 'read-web-pages',
        title: 'Read web pages',
        blocks: [
          {
            type: 'p',
            text: 'In the **Read web pages** tab you read individual web pages, independently of the company search. A job works through a list of addresses.',
          },
          {
            type: 'steps',
            items: [
              'Click **New job** at the top right.',
              'Enter a **Name** and choose the kind of job: **Structured data** or **Contact details**.',
              'Enter the addresses under **URLs (one per line)**, each with http:// or https://, at most 50 per job.',
              'Optional: with **Must contain term**, MixMarket only processes pages on which this term appears.',
              'For **Structured data**, tick **Extract email addresses** if email addresses should be collected as well. For **Contact details**, MixMarket always looks for email addresses.',
              'Tick **Use browser (for dynamic pages)** for pages whose content is only built in the browser.',
              'For structured data, enter one field name and one CSS selector per row in the optional fields, that is the technical description of where on the page the value is.',
              'Start the job with the button at the bottom.',
            ],
          },
          {
            type: 'list',
            items: [
              'The job runs in the background. The list shows the kind, number of results, date and the status **Running**, **Done** or **Error**.',
              '**Results** shows the values found with their source.',
              '**Import as contacts** creates new contacts from results with an email address. Existing addresses are skipped. The new contacts are in no list and have no consent.',
            ],
          },
          {
            type: 'list',
            items: [
              'MixMarket does not accept addresses without http:// or https:// or more than 50 addresses. The job then does not start, and MixMarket states the reason.',
              'MixMarket never fetches addresses in your own network, such as localhost or private IP addresses like 192.168.x.x, nor addresses with a port other than 80 or 443 or with credentials. Such addresses deliver no results, the other addresses of the job are still processed.',
              'MixMarket reads at most 1.5 MB of each page and leaves out the rest.',
              'MixMarket only uses the browser if you have ticked **Use browser (for dynamic pages)**. In the browser, too, MixMarket blocks every request to addresses in your own network.',
            ],
          },
          {
            type: 'tip',
            text: 'For the kind **Contact details**, MixMarket collects email addresses even when **Extract email addresses** is not ticked.',
          },
        ],
      },
    ],
  },
  {
    id: 'outbox',
    title: 'Outbox',
    summary: 'In the outbox, the AI writes personal emails to individual prospects. You check and approve them; MixMarket sends them according to your sending rules and follows up if you wish.',
    sections: [
      {
        id: 'purpose',
        title: 'What the outbox is for',
        blocks: [
          {
            type: 'p',
            text: 'The **Outbox** sends personal emails to individual prospects from research. Instead of one template for everyone, the AI writes a separate first email for each company. You check and approve every email, and MixMarket sends it according to your sending rules. If you wish, up to three follow-ups follow in the same thread.',
          },
          {
            type: 'p',
            text: 'Open the **Outbox** from the top bar, on narrow screens from the side panel.',
          },
          {
            type: 'tip',
            text: 'The outbox is a second way alongside campaigns. A campaign sends the same template to whole lists; the outbox writes to each company individually. You need no template, list or campaign for it.',
          },
          {
            type: 'p',
            text: 'It requires an AI provider that you have chosen and saved in **Settings**, section **AI rating**. For real sending you also need a mailbox that is set up (section Test mode and notices).',
          },
          {
            type: 'p',
            text: 'Everything that happens in the outbox is listed in **Activity** under the area **Outbox**. Drafts by the AI appear there with the actor “KI-Postausgang”.',
          },
          {
            type: 'p',
            text: 'You find recipients’ replies and bounces in **Conversations**. A reply ends the prospect’s sequence by itself (section When a sequence ends).',
          },
          {
            type: 'p',
            text: 'With the autopilot on the **Overview**, the outbox can run by itself: Writing fills it with companies of saved target groups from the minimum fit, Sending sends the approved emails. The emergency stop halts all sending (Overview, Autopilot and Emergency stop).',
          },
        ],
      },
      {
        id: 'contact-prospects',
        title: 'Contact prospects',
        blocks: [
          {
            type: 'steps',
            items: [
              'Open **Research**, tab **Prospects**, and check that the right product is chosen at the top.',
              'Click **Contact** in a prospect’s row, or **Contact new** at the top right for all prospects of the product that can be contacted.',
              'Read the notes in the window and confirm with **Contact**.',
            ],
          },
          {
            type: 'list',
            items: [
              'Prospects with the status New, a known email address and not yet in the outbox can be contacted. **Contact new** includes all such prospects of the product, regardless of the chosen status filter.',
              'If the contact is missing, MixMarket creates it as with **Add to contacts**: with the source “research”, without consent and in the product’s prospect list. Addresses on the suppression list and contacts that are not active are skipped.',
              'MixMarket reports how many emails are being written. A separate message names prospects that are already in the outbox.',
              'The prospect’s row then shows a link such as “Outbox: To approve”, after sending for example “Outbox: email 1 sent”. Clicking it opens the **Outbox**.',
              'If no AI provider is selected in the settings, MixMarket creates no email and reports “Please select an AI provider in the settings first.”',
              'The Writing autopilot creates first emails by itself in the same way, at most as many per day as the daily limit allows (Overview, Autopilot).',
            ],
          },
          {
            type: 'tip',
            text: 'A prospect enters the outbox only once. Even after its sequence has ended, it cannot be contacted there again.',
          },
          {
            type: 'warning',
            text: 'If a chosen prospect has no contact with documented consent, the window warns you: email advertising without consent may be unlawful under section 7 of the German UWG. Check each case before approving.',
          },
        ],
      },
      {
        id: 'ai-drafts',
        title: 'How the AI writes',
        blocks: [
          {
            type: 'p',
            text: 'The AI writes with the provider you chose in **Settings**, section **AI rating**. For each email it gets these details:',
          },
          {
            type: 'list',
            items: [
              'Your product with name, website and the description under **What you sell**, plus your company name.',
              'Your **Notes for the AI** from the product’s sequence.',
              'The prospect’s contact person. If none is known, the AI is told that the email goes to the company’s general address.',
              'Angle and reasoning from the AI rating, if available.',
              'The details collected about the company in research.',
              'For follow-ups, also the emails already sent to this company.',
            ],
          },
          {
            type: 'p',
            text: 'MixMarket adds the greeting and the closing itself. It builds the greeting from salutation, title and name of the contact as for the placeholder {{anrede}}, in the **Language of the emails** of the sequence (Contacts, Salutation and title). The closing reads “Mit freundlichen Grüßen” or “Kind regards”. If no **Signature** is stored in the settings, the **Sender name** from the mailbox appears below it, or the **Company name** if that is missing. If your signature already contains a closing such as “Viele Grüße”, “Mit freundlichen Grüßen” or “Best regards”, MixMarket does not add its own closing above it, so it does not appear twice. Emojis and pictographs never appear in the emails: the AI is told not to write any, and MixMarket also removes them if the text contains some anyway.',
          },
          {
            type: 'p',
            text: 'If the imprint does not say whether the contact person is a man or a woman, the AI derives the salutation from the first name while writing. The email then starts, for example, with “Sehr geehrter Herr Muster” or “Dear Mr Smith”. Only for ambiguous first names does it stay with “Guten Tag Erika Muster” or “Dear John Smith” with first and last name. MixMarket stores the derived salutation in the contact’s **Salutation** field, where you can change it at any time (Contacts, Salutation and title).',
          },
          {
            type: 'list',
            items: [
              'The AI is told to write factually and without sales talk, to use only facts from the details and not to invent figures, customers, prices or dates. The first email should have at most 120 words, a follow-up at most 70.',
              'The email is plain text without formatting. Addresses starting with http or https become clickable links when sent.',
              'The AI writes only one email at a time. While it writes, the email is shown with the status **AI is writing** in the **To approve** tab. This usually takes less than a minute; the view updates by itself.',
            ],
          },
          {
            type: 'p',
            text: 'If writing fails, the email is listed with the status **Error** and the **Error message** in the **Ended** tab. If the AI cannot be reached at all, for example because the subscription is not signed in, this affects all emails currently waiting for the AI. Use **Rewrite** to try again.',
          },
          {
            type: 'p',
            text: 'An AI pause does not count as an error: the emails stay at **AI is writing** and are written after the pause (Overview, AI pause).',
          },
          {
            type: 'warning',
            text: 'The AI can be wrong. Read every email before approving it.',
          },
        ],
      },
      {
        id: 'review',
        title: 'Check and approve',
        blocks: [
          {
            type: 'tip',
            text: '**Approve all** is part of MixMarket Pro. Without Pro you approve each email individually.',
          },
          {
            type: 'p',
            text: 'In the **To approve** tab, the finished emails wait for you. Select an email in the list. The view shows company, product and town, the recipient under **To**, the **Subject** and the text. Below the text, the preview also shows the signature, postal address and unsubscribe note as they are appended when sending, with the note “MixMarket adds the signature, postal address and unsubscribe note automatically when sending.” The buttons are below:',
          },
          {
            type: 'terms',
            items: [
              { term: 'Approve', text: 'The email moves to the **Scheduled** tab and goes out in the next sending window, a follow-up no earlier than its due date.' },
              { term: 'Edit', text: 'Change **Subject** and text and click **Save**, or discard the change with **Cancel**. The email is then marked **Edited by you**. A written email with an error returns to the **To approve** tab after saving.' },
              { term: 'Rewrite', text: 'Opens the window **Have it rewritten**. Under **Request to the AI** you can optionally say what should change, for example shorter or without a link. With **Rewrite** the AI writes the email again and replaces the previous version, including your changes.' },
              { term: 'Reject', text: 'The email does not go out, and the sequence for this prospect ends. All its open emails are dropped.' },
              { term: 'End sequence', text: 'All open emails of this prospect are dropped, including upcoming follow-ups. They are then listed in the **Ended** tab with the reason “Ended manually”.' },
            ],
          },
          {
            type: 'list',
            items: [
              '**Approve** is only available for emails waiting for approval.',
              '**Edit**, **Rewrite** and **Reject** also work for approved emails that have not been sent yet, and for emails with an error.',
              '**End sequence** is available while the sequence is running, including for upcoming follow-ups.',
              'MixMarket asks for confirmation before **Reject** and **End sequence**.',
            ],
          },
          {
            type: 'p',
            text: 'With **Approve all** you approve all finished emails in the **To approve** tab at once. If you have chosen a product instead of **All products**, this applies only to its emails. The confirmation names the number of emails and points out that they go out one after another within the sending window, at most as many per day as your daily limit. Emails the AI is still writing are left out.',
          },
          {
            type: 'warning',
            text: 'If emails in the **To approve** tab go to contacts without documented consent, a warning with their number appears above the list, and also in the confirmation for **Approve all**. Each such email carries the label **No consent**. Check each case before approving.',
          },
        ],
      },
      {
        id: 'views',
        title: 'Tabs and view',
        blocks: [
          {
            type: 'terms',
            items: [
              { term: 'To approve', text: 'Emails the AI is writing or that are waiting for your approval.' },
              { term: 'Scheduled', text: 'Approved emails and upcoming follow-ups that have not been written yet.' },
              { term: 'Sent', text: 'Delivered emails, including test sends, with opens and clicks.' },
              { term: 'Ended', text: 'Rejected emails, emails with an error and emails whose sequence has ended.' },
            ],
          },
          {
            type: 'list',
            items: [
              'Each tab shows the number of its emails. On a phone you choose the tab from a dropdown.',
              'The **All products** selection can show the emails of a single product. The tab counts follow this selection.',
              'Each row shows company, time, status, the position in the sequence such as **First email** or **Follow-up 1**, the recipient, the subject and the beginning of the text.',
              'On wide screens, the list is on the left and the selected email on the right. On narrow screens, a click opens the email in a window; **Back to the list** closes it again.',
            ],
          },
          {
            type: 'p',
            text: 'At the top of an email’s view, a sequence bar shows all its stations: **First email**, **Follow-up 1** and so on. Sent stations show their status, open ones the planned time. Below that are the details of this email:',
          },
          {
            type: 'list',
            items: [
              '“After approval, from” for emails waiting for approval and “Scheduled from” for approved emails, each with the earliest sending time.',
              '“Due” for upcoming follow-ups and “Sent on” for delivered emails.',
              '**Opened** and **Link clicked** as soon as the recipient has opened the email or clicked a link. As with campaigns, opens are only a rough indication.',
              '**Edited by you** if you have changed the text.',
              'For ended emails the reason, for emails with an error the **Error message**.',
            ],
          },
          {
            type: 'p',
            text: 'Above the tabs, a status line shows the state of sending: how many emails were sent today, for example “3 of 20 sent today”, the sending days and times such as “Mon to Fri, 08:00 to 17:00”, and next to it **Sending window open**, “Next send from” with a time, or **Daily limit reached**.',
          },
        ],
      },
      {
        id: 'sequence',
        title: 'Sequence per product',
        blocks: [
          {
            type: 'tip',
            text: 'Follow-up emails are part of MixMarket Pro. Without Pro every prospect only gets the first email. You still set language, approval and notes for the AI here.',
          },
          {
            type: 'p',
            text: 'With **Sequence** at the top right, you set per product how many emails a prospect receives at most, at what interval and in which language.',
          },
          {
            type: 'steps',
            items: [
              'Click **Sequence** and choose the product under **Product**. The product from the selection above the list is preselected, otherwise the one chosen in Research.',
              'Under **Follow-ups**, choose how many follow-ups come after the first email, from **No follow-up** to **3 follow-ups**.',
              'For each follow-up, enter the number of days under **Interval before follow-up 1** and so on, 1 to 60. Counting starts when the previous email was sent.',
              'Under **Language of the emails**, choose **German** or **English**. Text, greeting, closing and unsubscribe note follow this choice.',
              'Keep **Approve every email before sending** ticked if you want to check every email yourself.',
              'Under **Notes for the AI** you can say what the AI should pay attention to, for example to offer a short video demo.',
              'Click **Save**.',
            ],
          },
          {
            type: 'list',
            items: [
              'The defaults are 2 follow-ups at intervals of 4 and 7 days, the language German and approval of every email.',
              'Without the tick **Approve every email before sending**, the AI emails go straight to the **Scheduled** tab and out unchecked.',
              'Exception: if the AI has put a link to a foreign domain into an email, the email still lands in the **To approve** tab. The product’s **Website (optional)** counts as its own domain, together with its subdomains and its parent domain. Addresses without http such as example.com also count as links, email addresses do not. If the product has no website, every link counts as foreign.',
              'If you set fewer follow-ups, surplus follow-ups of this product that are already queued are dropped. They are then listed in the **Ended** tab.',
              'Your settings apply to all emails written or queued afterwards. MixMarket does not change texts that have already been written.',
              'If there is no product yet, the window shows the note “Create a product under Research first.”',
            ],
          },
          {
            type: 'warning',
            text: 'Without approval, the AI emails go out unchecked, except those with a link to a foreign domain. Keep the tick set as long as you do not know the AI emails well.',
          },
        ],
      },
      {
        id: 'follow-ups',
        title: 'Follow-up emails',
        blocks: [
          {
            type: 'tip',
            text: 'Follow-up emails are part of MixMarket Pro.',
          },
          {
            type: 'list',
            items: [
              'As soon as an email has been sent, MixMarket queues the next follow-up if the sequence provides one. It is listed with the status **Upcoming** and its due date in the **Scheduled** tab.',
              'About one day before the due date, the AI writes the follow-up. It knows the emails sent so far and is told to bring in a new point. The email then appears in the **To approve** tab, without approval directly under **Scheduled**, unless it contains a link to a foreign domain (section Sequence per product).',
              'It is sent no earlier than the due date, in the next sending window.',
              'Follow-ups go out as a reply in the same thread. Their subject is the subject of the first email with “Re:” in front, and email programs can match them to the first email.',
              'The last follow-up of a sequence politely announces that no further email will follow.',
            ],
          },
          {
            type: 'tip',
            text: 'The intervals count from the actual sending of the previous email. If an email waits longer for your approval, the following due dates move accordingly.',
          },
        ],
      },
      {
        id: 'send-rules',
        title: 'Sending rules',
        blocks: [
          {
            type: 'p',
            text: 'With **Sending rules** at the top right, you set when and how many emails the outbox sends. The rules apply to all emails from the outbox, not to campaigns and automations.',
          },
          {
            type: 'terms',
            items: [
              { term: 'Sending days', text: 'The weekdays on which emails are sent. At least one day is required.' },
              { term: 'From and To', text: 'Start and end of the sending window as a time such as 08:00, in the server’s local time. The start must be before the end.' },
              { term: 'Daily limit', text: 'Maximum number of emails per day, 1 to 500.' },
              { term: 'Gap between emails', text: 'Minimum gap between two emails in minutes, 1 to 240.' },
            ],
          },
          {
            type: 'p',
            text: 'The defaults are Monday to Friday, 08:00 to 17:00, 20 emails per day and a 3 minute gap. **Save** applies the rules.',
          },
          {
            type: 'list',
            items: [
              'Approved emails go out in the next sending window at the earliest, one after another, the one with the earliest due date first. MixMarket checks every minute.',
              'Once the daily limit is reached, sending continues on the next sending day. Test sends count towards the daily limit.',
              'Emails are sent with the **Sender name** and **Sender address** of your mailbox from the settings.',
              'After the first email has been sent, MixMarket changes the prospect’s status from New to Contacted.',
              'If the Sending autopilot is off or the emergency stop is active, the outbox sends nothing. Approved emails then wait, and the AI keeps writing (Overview).',
            ],
          },
          {
            type: 'tip',
            text: 'A low daily limit and a gap between emails help keep your mailbox from looking like a bulk sender.',
          },
        ],
      },
      {
        id: 'auto-stop',
        title: 'When a sequence ends',
        blocks: [
          {
            type: 'p',
            text: 'A sequence ends by itself, and all open emails of the prospect are dropped, in these cases:',
          },
          {
            type: 'list',
            items: [
              'The recipient replies. As soon as MixMarket has fetched the reply from the mailbox, the sequence ends with the reason “Recipient replied”, and the prospect changes from New or Contacted to In talks (Conversations). Out-of-office replies do not end the sequence.',
              'The prospect’s status changes to In talks, Not interested or Customer.',
              'The recipient unsubscribes via the link in an email or the unsubscribe button of their email program. Their prospects then also get the status Not interested. If the AI sorts a reply as Unsubscribe, the sequence ends in the same way, and the prospect of that reply gets the status Not interested.',
              'An email to the address comes back as permanently undeliverable. The address then goes on the suppression list, and the **Ended** tab shows the reason “Email was undeliverable”.',
              'The address is on the suppression list.',
              'The contact is missing or no longer active.',
              'You reject an email of the sequence.',
              'You end the sequence manually with **End sequence**.',
            ],
          },
          {
            type: 'p',
            text: 'You see the reason in the **Ended** tab for each affected email, for example “Recipient replied”, “Recipient unsubscribed” or “Prospect status changed”.',
          },
          {
            type: 'p',
            text: 'Immediately before every send, and before the AI writes a follow-up, MixMarket checks these conditions again. This way no email goes to someone who has unsubscribed or been suppressed in the meantime.',
          },
          {
            type: 'tip',
            text: 'MixMarket only recognises replies and bounces if receiving (IMAP) is set up in **Settings**, section **Mailbox**. Without receiving, set the prospect’s status to In talks yourself as soon as someone replies. This also ends the sequence.',
          },
        ],
      },
      {
        id: 'test-mode',
        title: 'Test mode and notices',
        blocks: [
          {
            type: 'p',
            text: 'If no mailbox is set up, the outbox shows a test mode notice at the top with the button **Set up mailbox**, which leads to the **Mailbox** section of the settings. In test mode, approval and sending rules work as usual, but the emails are only marked as sent and not delivered. In the list they carry the status **Test send**, in the view the note “Test send, not delivered”.',
          },
          {
            type: 'p',
            text: 'If no AI provider is selected, a notice appears with the button **Set up AI**, which leads to the **AI rating** section of the settings. Without AI the outbox writes no emails.',
          },
          {
            type: 'warning',
            text: 'A test send also counts as sent: the prospect changes to Contacted, the next follow-up is queued, and the prospect cannot be contacted again afterwards. So try test mode with prospects you do not intend to contact for real later.',
          },
        ],
      },
      {
        id: 'legal',
        title: 'Required details and law',
        blocks: [
          {
            type: 'list',
            items: [
              'Like a campaign email, every email from the outbox contains your **Signature** if entered, the footer with **Postal address (required in footer)**, unsubscribe note and unsubscribe link in the **Language of the emails**, and an automatically created plain text version.',
              'MixMarket sends a technical unsubscribe header so that email programs can show their own unsubscribe button.',
              'Opens and clicks are counted as for campaigns, through an invisible image and redirected links.',
            ],
          },
          {
            type: 'warning',
            text: 'Contacts from research have no documented consent. Email advertising without consent may be unlawful under German UWG § 7, even if every email is written individually. Check each case before approving. More on this in the Law and deliverability chapter.',
          },
        ],
      },
    ],
  },
  {
    id: 'conversations',
    title: 'Conversations',
    summary: 'In Conversations, MixMarket collects the replies to your emails from the mailbox, recognises bounces and out-of-office replies, has the AI sort replies and helps you answer.',
    sections: [
      {
        id: 'purpose',
        title: 'What conversations are for',
        blocks: [
          {
            type: 'p',
            text: 'Replies to your emails end up in **Conversations**. MixMarket reads your mailbox for this, matches each reply to the email and the contact it refers to, and groups everything per contact into a conversation. A genuine reply ends the sequence in the outbox immediately. If the Replies autopilot is switched on, the AI then sorts the reply and, for interest or a question, writes a reply draft.',
          },
          {
            type: 'p',
            text: 'Open **Conversations** from the top bar, on narrow screens from the side panel. The number after **Conversations** gives the open replies.',
          },
          {
            type: 'tip',
            text: 'No reply goes out without your click on **Send**. AI drafts always wait for you.',
          },
          {
            type: 'p',
            text: 'It requires receiving to be set up in **Settings**, section **Mailbox**, under **Receiving (IMAP)**. For sorting and drafts you also need an AI provider in the section **AI rating**.',
          },
        ],
      },
      {
        id: 'fetching',
        title: 'Checking the mailbox',
        blocks: [
          {
            type: 'p',
            text: 'MixMarket checks the **Folder for replies** from the settings about every 2 minutes. It opens the mailbox read only: emails stay unread and unchanged, and MixMarket moves and deletes nothing.',
          },
          {
            type: 'list',
            items: [
              'On the first check, MixMarket looks back 14 days. After that it only fetches emails that have arrived since the last check.',
              'MixMarket processes at most 200 emails per check; the rest follow at the next check. It does not load emails over 8 MB, which usually have large attachments.',
              'With **Check now** at the top right you check the mailbox immediately. MixMarket then reports, for example, “Checked, 2 new emails” or “Checked, nothing new”.',
              'Above the list, a status line shows “Last checked” with date and time, before the first check “Not checked yet”, next to “Checked every 2 minutes, read only”.',
            ],
          },
        ],
      },
      {
        id: 'what-is-stored',
        title: 'Which emails MixMarket stores',
        blocks: [
          {
            type: 'p',
            text: 'MixMarket only stores emails that belong to your work in MixMarket:',
          },
          {
            type: 'list',
            items: [
              'Replies to your own emails, that is to emails from the outbox, to campaign emails and to your replies in **Conversations**. MixMarket recognises them by the email thread, even if the reply comes from a different address.',
              'Emails from known contacts, that is from addresses listed in **Contacts**. This is also how MixMarket recognises replies to follow-up emails from automations. An email a contact writes on their own also counts as a reply.',
              'Bounces for your own emails or to known contacts.',
            ],
          },
          {
            type: 'p',
            text: 'MixMarket does not store any other emails; they stay in your mailbox only. MixMarket never treats emails with your mailbox’s sender address as a reply. An email that is already stored is not taken a second time.',
          },
          {
            type: 'p',
            text: 'A conversation covers all emails of one contact. If an email belongs to no contact, the sender address forms the conversation, for bounces the undeliverable address.',
          },
        ],
      },
      {
        id: 'replies',
        title: 'What a reply triggers',
        blocks: [
          {
            type: 'p',
            text: 'If an email is a genuine reply, that is neither a bounce nor an out-of-office reply, the following happens immediately:',
          },
          {
            type: 'list',
            items: [
              'The sequence in the outbox ends. All open emails are dropped and are listed in the outbox in the **Ended** tab with the reason “Recipient replied”. If the reply belongs to a prospect, this applies to their sequence, otherwise to all sequences of the contact.',
              'The prospect changes from the status New or Contacted to In talks. Other statuses stay.',
              'The reply is open and counts towards **Conversations** in the top bar.',
              'If the Replies autopilot is switched on, the AI sorts the reply (section Sorting by the AI).',
            ],
          },
          {
            type: 'tip',
            text: 'MixMarket only recognises a reply at the next check of the mailbox. Until then the sequence in the outbox keeps running. **Check now** fetches new emails immediately.',
          },
        ],
      },
      {
        id: 'ai-category',
        title: 'Sorting by the AI',
        blocks: [
          {
            type: 'tip',
            text: 'Sorting by the AI is part of MixMarket Pro. Without Pro, new replies show **Not sorted** and you sort them yourself.',
          },
          {
            type: 'p',
            text: 'The AI reads every genuine reply without the quoted earlier emails, plus up to six earlier emails with this contact, your company name and, if the reply belongs to a prospect, your product with its description and your **Notes for the AI**. It chooses one of five categories and summarises the reply in one sentence in German. In **Activity** it appears as the actor “KI-Gespräche”.',
          },
          {
            type: 'terms',
            items: [
              { term: 'Interested', text: 'The recipient wants to know more, for example a meeting, an offer or a trial.' },
              { term: 'Question', text: 'The recipient asks a specific question without clear interest.' },
              { term: 'Not interested', text: 'The recipient declines, has no need or already has a solution.' },
              { term: 'Unsubscribe', text: 'The recipient wants no further emails, asks for their data to be deleted or objects.' },
              { term: 'Other', text: 'Anything else, for example forwarding to a colleague.' },
            ],
          },
          {
            type: 'p',
            text: 'Depending on the category, MixMarket applies these consequences:',
          },
          {
            type: 'list',
            items: [
              '**Not interested** and **Unsubscribe** set the matching prospect to Not interested. A customer stays a customer.',
              '**Unsubscribe** also puts the address on the suppression list with the reason Unsubscribed; an existing suppression reason stays. The contact gets the status Unsubscribed, running sequences in the outbox to this address end, and open drafts for this reply are dropped. Replies to this address can no longer be sent afterwards.',
              'For **Interested**, **Question** and **Other**, MixMarket sets a prospect with the status New or Contacted to In talks.',
              'For **Interested** and **Question**, the AI also creates a reply draft (section Write and send replies).',
            ],
          },
          {
            type: 'p',
            text: 'While the AI is working, the reply shows **AI is sorting**. If sorting fails, for example because no AI provider is selected or the AI cannot be reached, it shows **Sorting failed** with the error message. Sort the reply yourself in that case.',
          },
          {
            type: 'p',
            text: 'The AI only sorts while the Replies autopilot on the **Overview** is switched on. If it is off, new replies stay at **AI is sorting**, get no automatic draft and are sorted as soon as you switch it on again. During an AI pause they also wait and are sorted after the pause (Overview, Autopilot and AI pause).',
          },
          {
            type: 'tip',
            text: 'If you sort a waiting reply yourself, the AI no longer takes it over afterwards.',
          },
        ],
      },
      {
        id: 'category-manual',
        title: 'Change the category yourself',
        blocks: [
          {
            type: 'p',
            text: 'Every reply in the thread has the dropdown **Category**. If you choose a different category there, MixMarket applies the same consequences as for the AI and records the change in **Activity**.',
          },
          {
            type: 'list',
            items: [
              'A manual change does not create a reply draft. For that, click **Draft reply** under **Your reply**.',
              'Consequences are not reversed. If you change **Unsubscribe** to **Interested**, for example, the address stays suppressed and the prospect stays Not interested. You then change the status under **Prospect status**, and lift the suppression under **Suppression** with **Release**.',
            ],
          },
          {
            type: 'warning',
            text: 'The AI can be wrong. Check replies with the category **Unsubscribe** or **Not interested** in particular, because they change prospect, contact and suppression list without asking.',
          },
        ],
      },
      {
        id: 'bounces',
        title: 'Bounces',
        blocks: [
          {
            type: 'p',
            text: 'A bounce is a mail server’s message that an email could not be delivered. MixMarket recognises it by the sender, such as mailer-daemon or postmaster, by the technical delivery report or by the subject, such as “Undeliverable” or “Unzustellbar”. From the message it reads the affected address and whether the error is permanent or temporary. Without a clear statement it counts as permanent.',
          },
          {
            type: 'terms',
            items: [
              { term: 'Undeliverable', text: 'Permanent error, for example an address that does not exist. MixMarket puts the address on the suppression list with the reason Bounced; an existing suppression reason stays. An active contact gets the status Bounced. Running sequences in the outbox to this address end with the reason “Email was undeliverable”. If the email came from a campaign, MixMarket records the send to this address as bounced.' },
              { term: 'Temporarily undeliverable', text: 'Temporary error. MixMarket only records the message and changes nothing about address, contact or sequence. The mail server usually tries again.' },
            ],
          },
          {
            type: 'list',
            items: [
              'Bounces are listed in the **Undeliverable** view, not under **Open** and **All**. Permanent bounces stay open until you close them with **Done**; temporary ones count as done straight away. The number on **Undeliverable** gives the open bounces.',
              'In the thread, a bounce appears as **Bounce message** with a note on what MixMarket did. You cannot reply to a bounce.',
              'Every bounce appears in **Activity**, a permanent one as a warning. A permanent one also appears as a notice under **Waiting for you** on the Overview.',
              'Permanent bounces count towards the automatic emergency stop. If there are too many in 24 hours, MixMarket stops all sending (Overview, Emergency stop).',
            ],
          },
        ],
      },
      {
        id: 'auto-replies',
        title: 'Out-of-office replies',
        blocks: [
          {
            type: 'p',
            text: 'MixMarket recognises automatic replies such as out-of-office notes, holiday messages or acknowledgements of receipt by their technical marking or by the subject, for example “Out of Office”, “Automatic reply” or “Abwesenheit”.',
          },
          {
            type: 'list',
            items: [
              'They appear in the conversation with the label **Out of office** and count as done straight away. You find them in the **All** view.',
              'They do not end a sequence in the outbox, do not change the prospect’s status and are not sorted by the AI.',
              'You cannot reply to an out-of-office reply.',
            ],
          },
        ],
      },
      {
        id: 'views',
        title: 'Views and list',
        blocks: [
          {
            type: 'terms',
            items: [
              { term: 'Open', text: 'Conversations with at least one open reply. The page opens with this view.' },
              { term: 'All', text: 'All conversations with replies and out-of-office replies, including done ones.' },
              { term: 'Undeliverable', text: 'All bounces, grouped per contact or address.' },
            ],
          },
          {
            type: 'list',
            items: [
              '**Open** shows the number of open replies, **Undeliverable** the number of open bounces. On a phone you choose the view from a dropdown.',
              'Each row shows company or sender, the time of the latest email, the label, the sender’s name and the AI summary, or without a summary the subject and the beginning of the text. Conversations with open replies are highlighted.',
              'If a conversation has several emails, the note “2 new” gives the open ones. **Draft** shows that a reply draft is waiting.',
              'Labels are the AI category, **AI is sorting**, **Sorting failed**, **Out of office**, **Undeliverable** and **Temporarily undeliverable**.',
              'On wide screens, the list is on the left and the selected conversation on the right. On narrow screens, a click opens the conversation in a window; **Back to the list** closes it again.',
              'The view updates by itself, at short intervals while the AI is working.',
            ],
          },
        ],
      },
      {
        id: 'thread',
        title: 'The thread',
        blocks: [
          {
            type: 'p',
            text: 'The view of a conversation shows company, name and address of the contact and the product at the top. Below is the whole thread, oldest email first:',
          },
          {
            type: 'list',
            items: [
              '**Your email** from the outbox with its number in the sequence, for example “Your email, outbox 1”, and its text.',
              'Campaign emails with the campaign name and the subject, without text.',
              'Replies with label, AI summary and the dropdown **Category**. Only the new reply is shown. You show quoted earlier emails with **Show quote** and hide them again with **Hide quote**.',
              '**Your reply** for every reply you sent from **Conversations**, in test mode with the note “Test send, not delivered”.',
              'Bounces and out-of-office replies with a short note.',
            ],
          },
          {
            type: 'p',
            text: 'The thread shows all emails this contact received from you through the outbox and campaigns, not only the one that was answered.',
          },
          {
            type: 'p',
            text: 'At the top right you close the conversation with **Done**. All open emails of the conversation then count as done, and it disappears from **Open**. Once nothing is open, the button reads **Reopen**, which brings the conversation back to **Open**.',
          },
          {
            type: 'p',
            text: 'If the conversation belongs to a prospect, you change its status directly in the dropdown **Prospect status**, just as in Research (Research, Prospects).',
          },
        ],
      },
      {
        id: 'reply',
        title: 'Write and send replies',
        blocks: [
          {
            type: 'tip',
            text: 'AI reply drafts are part of MixMarket Pro. With **Write myself** you can reply without Pro too.',
          },
          {
            type: 'p',
            text: '**Your reply** is below the thread. If there is no draft yet, you choose:',
          },
          {
            type: 'terms',
            items: [
              { term: 'Draft reply', text: 'The AI writes a draft for the latest reply of the conversation. This usually takes less than a minute; the view updates by itself. It needs an AI provider in the settings. This also works with the Replies autopilot switched off. During an AI pause, the draft is written after the pause.' },
              { term: 'Write myself', text: 'An empty draft with subject, greeting and closing. If your signature already contains a closing, the separate closing is left out. You write the text in between.' },
            ],
          },
          {
            type: 'p',
            text: 'Once there is a draft, you change **Subject** and text directly in the field. The buttons are below:',
          },
          {
            type: 'terms',
            items: [
              { term: 'Send', text: 'After a confirmation, the reply goes out immediately. MixMarket saves unsaved changes first.' },
              { term: 'Save draft', text: 'Appears as soon as you have changed something, and stores the draft.' },
              { term: 'Rewrite', text: 'Opens the window **Have the reply rewritten**. Under **Request to the AI** you can optionally say what should change, for example shorter or with a suggested date. With **Rewrite** the AI replaces the previous draft, including your changes.' },
              { term: 'Discard', text: 'Deletes the draft after a confirmation. You can then start again.' },
            ],
          },
          {
            type: 'list',
            items: [
              'The subject is required and the text needs at least 10 characters. Otherwise MixMarket marks the field in red and does not send.',
              'AI drafts are written in the language of the reply, German or English, in German in the formal form, with at most 120 words. MixMarket adds greeting and closing itself, as in the outbox. When you write yourself, the **Language of the emails** from the product’s sequence applies, German if there is no product.',
              'The AI is told to use only facts from your product description and not to invent prices, dates or commitments. What it does not know, it is told to promise to follow up on.',
              'If the address is suppressed, a note with the suppression reason replaces the buttons, and no reply can be sent.',
              'If sending fails, the error message appears above the draft. Try again with **Send**.',
              'If the emergency stop is active, MixMarket sends no reply and reports “Sending is stopped by the emergency stop.” The draft stays waiting for approval (Overview, Emergency stop).',
            ],
          },
          {
            type: 'warning',
            text: 'The AI can be wrong. Read every draft before sending.',
          },
        ],
      },
      {
        id: 'sending',
        title: 'How replies are sent',
        blocks: [
          {
            type: 'list',
            items: [
              'Replies go out immediately, without the outbox’s sending window and daily limit, and do not count towards them. During an emergency stop they do not go out.',
              'They go out as a reply in the same thread, to the contact’s address, without a contact to the reply’s sender address. The subject is the subject of the incoming email with “Re:” in front; you can change it.',
              'The email contains your text, below it your **Signature** and your **Postal address (required in footer)** if entered, and the recipient’s quoted email. It contains no tracking pixel and no unsubscribe link.',
              'It is sent with the **Sender name** and **Sender address** of your mailbox.',
              'After sending, the answered email is done. If other emails in the conversation are still open, close them with **Done**.',
              'Suppressed addresses get no reply, not even through a draft written earlier.',
            ],
          },
        ],
      },
      {
        id: 'notices',
        title: 'Notices and test mode',
        blocks: [
          {
            type: 'list',
            items: [
              'If receiving is not set up, the page shows a notice with the button **Set up mailbox**. It leads to the **Mailbox** section of the settings.',
              'If a check fails, a notice with the full message from the mail server appears above the list, also with **Set up mailbox**. In **Activity** the same error appears only once, not at every check. On the Overview it also appears under **Waiting for you**.',
              'If no outgoing server is set up, MixMarket runs in test mode. Replies are then only marked as sent and not delivered.',
              'If no AI provider is selected, a notice appears with the button **Set up AI**. Replies are then not sorted and no drafts are created. **Write myself** and the dropdown **Category** still work.',
            ],
          },
          {
            type: 'p',
            text: 'Everything that happens in **Conversations** is listed in **Activity** under the area **Conversations**: incoming replies, out-of-office replies and bounces, the AI category and your changes to it, reply drafts, sent replies and errors when checking the mailbox.',
          },
        ],
      },
    ],
  },
  {
    id: 'suppression',
    title: 'Suppression',
    summary: 'Addresses on the suppression list are never written to again, neither by campaigns nor by automations, from the outbox or with a reply in Conversations.',
    sections: [
      {
        id: 'purpose',
        title: 'What the suppression list is for',
        blocks: [
          {
            type: 'p',
            text: 'The **Suppression** list is the central list of all addresses that must not receive any more emails. MixMarket removes them from every send, even if the contact is still in a list. Suppressed addresses are also skipped when you add prospects to the contacts and when you use **Contact**. Running sequences in the outbox to a suppressed address end immediately. In **Conversations**, no reply can be sent to a suppressed address.',
          },
          {
            type: 'p',
            text: 'Open the **Suppression** list from the user menu at the top right. On narrow screens it is in the side panel.',
          },
          {
            type: 'p',
            text: 'The table shows email, reason and date. The buttons at the top filter by reason; the search field searches the addresses.',
          },
        ],
      },
      {
        id: 'reasons',
        title: 'Reasons',
        blocks: [
          {
            type: 'terms',
            items: [
              { term: 'Unsubscribed', text: 'The recipient unsubscribed via the link in an email or asked for no further emails in a reply. MixMarket adds this automatically. The same reason results when you set a contact to the status Unsubscribed.' },
              { term: 'Bounced', text: 'The address cannot be reached. MixMarket adds this reason automatically when a permanent bounce arrives. You also assign it yourself when suppressing, or through a contact’s status Bounced.' },
              { term: 'Complaint', text: 'The recipient complained. You assign this reason yourself when suppressing, or through a contact’s status Complaint.' },
              { term: 'Manual', text: 'You suppressed the address for another reason.' },
            ],
          },
        ],
      },
      {
        id: 'unsubscribe-link',
        title: 'Unsubscribing via the link',
        blocks: [
          {
            type: 'p',
            text: 'Every email from MixMarket contains an unsubscribe link at the bottom, “Hier abmelden” or “Unsubscribe here” depending on the template language, or in the outbox depending on the **Language of the emails**. This applies to campaign emails as well as to follow-up emails from automations and emails from the outbox, but not to your personal replies in **Conversations**. Many email programs also offer their own unsubscribe button, which MixMarket supports as well. Unsubscribing takes effect immediately, without further confirmation:',
          },
          {
            type: 'list',
            items: [
              'The address is added to the suppression list with the reason Unsubscribed.',
              'The contact gets the status Unsubscribed.',
              'Their prospects with the status New, Contacted or In talks switch to Not interested. Customers stay customers.',
              'Running sequences in the outbox for this contact end, and all open emails are dropped.',
              'The recipient sees a confirmation page in German or English, depending on their browser language. They do not get a confirmation email.',
              'The unsubscribe appears in **Activity** and as a notice under **Waiting for you** on the Overview. MixMarket does not send you an email about it.',
            ],
          },
        ],
      },
      {
        id: 'from-conversations',
        title: 'Automatic suppression from Conversations',
        blocks: [
          {
            type: 'p',
            text: 'If receiving (IMAP) is set up, MixMarket also suppresses addresses because of incoming emails in **Conversations**:',
          },
          {
            type: 'list',
            items: [
              'Permanent bounce: the address goes on the suppression list with the reason Bounced and the note “Automatisch erkannter Rückläufer”. An active contact gets the status Bounced, and running sequences in the outbox to this address end.',
              'Unsubscribe request by reply: if the AI or you sort a reply as **Unsubscribe**, the address goes on the suppression list with the reason Unsubscribed and the note “Abmeldewunsch per Antwort”. The contact gets the status Unsubscribed, the prospect of the reply the status Not interested unless it is a customer, and running sequences in the outbox to this address end.',
            ],
          },
          {
            type: 'p',
            text: 'If the address is already on the suppression list, its previous reason stays. Temporary bounces suppress nothing.',
          },
          {
            type: 'p',
            text: 'Both cases appear as a notice under **Waiting for you** on the Overview, an unsubscribe request by reply only if the address was newly suppressed as a result. The AI only recognises unsubscribe requests by reply with the Replies autopilot switched on. If it is off, sort such replies as **Unsubscribe** yourself.',
          },
        ],
      },
      {
        id: 'manual-block',
        title: 'Suppress an address yourself',
        blocks: [
          {
            type: 'steps',
            items: [
              'Click **Suppress address** at the top right.',
              'Enter the **Email** and choose the **Reason**.',
              'Optionally, record in **Note** why you are suppressing the address.',
              'Click **Save**.',
            ],
          },
          {
            type: 'p',
            text: 'If there is a contact with this address, it gets the matching status: Bounced for the reason Bounced, Complaint for the reason Complaint, otherwise Unsubscribed. Running sequences in the outbox to this address end. The note is not shown in the table, but you can find it with the search.',
          },
        ],
      },
      {
        id: 'release',
        title: 'Release',
        blocks: [
          {
            type: 'p',
            text: 'With **Release** in a row, you take an address off the suppression list after a confirmation. It can then be written to again, and a matching contact becomes active again. An ended sequence in the outbox does not restart because of this.',
          },
          {
            type: 'warning',
            text: 'Only release an address if the recipient explicitly wants your emails again. You must respect an unsubscribe.',
          },
        ],
      },
    ],
  },
  {
    id: 'activity',
    title: 'Activity',
    summary: 'The activity log shows who did what and when: you, MixMarket itself and the AI.',
    sections: [
      {
        id: 'purpose',
        title: 'The log',
        blocks: [
          {
            type: 'p',
            text: 'Open **Activity** from the user menu at the top right. Entries are grouped by day, newest first. Each row shows the time, who acted, what happened, the affected item and the area.',
          },
          {
            type: 'list',
            items: [
              'Actors are you with the name of your account, MixMarket itself for automatic processes such as sending, unsubscribes or searches, and AI agents such as the AI rating, “KI-Postausgang”, which writes the emails in the outbox, “KI-Gespräche”, which sorts replies and writes reply drafts, and the “Autopilot”, which has searches analysed and target groups rated, adds prospects and puts them into the outbox.',
              'The area **Sign-in and account** holds the first setup, sign-ins and sign-outs, changes to name and email, password changes, new recovery keys and password resets. Failed sign-ins and recoveries appear with the email that was entered, as does a lock after too many failed attempts. A reset on the computer with npm run reset-password is logged with MixMarket as the actor.',
              'Warnings and errors are marked with a warning icon.',
              'When sending, the start and end of a campaign are logged, not every single email.',
              'The area **Outbox**, by contrast, lists every single email: drafts by the AI, your approvals, edits and rejections, sending, errors and ended sequences, plus changes to sequence and sending rules.',
              'The area **Conversations** lists incoming replies, out-of-office replies and bounces, the AI category and your changes to it, requested and written reply drafts, sent replies, conversations marked done or reopened, and errors when checking the mailbox. A recurring identical check error is logged only once.',
              'The area **Controls** lists your changes to autopilot and limits with before and after, every emergency stop, manual or automatic because of too many bounces, every release of sending, and the start and end of an AI pause.',
              'The list refreshes every 30 seconds. **Load older** fetches more entries.',
            ],
          },
        ],
      },
      {
        id: 'filters',
        title: 'Filters and search',
        blocks: [
          {
            type: 'list',
            items: [
              'The search field searches names, addresses and people in the entries.',
              '**All areas** narrows the list to one area, such as campaigns, **Outbox**, **Conversations**, **Controls**, mailbox or **Sign-in and account**.',
              '**Everyone** narrows it to **Users** (that is, you), **MixMarket (automatic)** or **AI agents**.',
              'The time range goes from **Today and yesterday** to **All time**. The default is **Last 30 days**.',
            ],
          },
        ],
      },
      {
        id: 'details',
        title: 'Details',
        blocks: [
          {
            type: 'p',
            text: 'Entries with an arrow on the right can be expanded. For changes, a table shows the **Before** and **After** value for each **Field**. For errors, the full server message is shown below, for example when a send was interrupted.',
          },
          {
            type: 'tip',
            text: 'Passwords, recovery keys and access keys never appear in plain text in the log. Changed access details only appear as changed.',
          },
        ],
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    summary: 'Here you manage your account and MixMarket Pro, enter company details, mailbox, search source access and the AI, and choose theme and language.',
    sections: [
      {
        id: 'account',
        title: 'Account',
        blocks: [
          {
            type: 'p',
            text: 'Open **Settings** from the user menu at the top right. In the **Account** section you manage your access to MixMarket. There is only this one account.',
          },
          {
            type: 'list',
            items: [
              '**Name** and **Email for sign-in**: change the details and click **Save account**. If you change the email, the field **Current password** appears as well. Without your password, MixMarket does not save a new email. From then on you sign in with the new email.',
              '**Change password**: enter **Current password**, **New password** with at least 10 characters and **Repeat new password**, then click **Change password**. You stay signed in. Other sign-ins, for example in a second browser, are signed out.',
              '**Recovery key**: the note below it shows whether a key is stored. **Create new key** opens a window. Enter your **Current password** there and click **Create new key** again. MixMarket shows the new key once, as on first start, with **Copy**, **Save as file** and the tick **I have stored the key safely.** Close the window with **Done**.',
            ],
          },
          {
            type: 'warning',
            text: 'A new key makes the previous one invalid immediately. From then on, keep only the new one.',
          },
          {
            type: 'tip',
            text: 'Create a new key if the old one is lost or someone else may have seen it. All account changes are listed in **Activity** under the area **Sign-in and account**.',
          },
        ],
      },
      {
        id: 'pro',
        title: 'MixMarket Pro',
        blocks: [
          {
            type: 'p',
            text: 'In the **MixMarket Pro** section you subscribe and unlock Pro. Pro adds guided tours, Autopilot, follow-up mails, automations, **Approve all**, AI in conversations, more search sources and template packs. Everything else stays free. Next to the heading you see the status, for example **Not active** or **Active**.',
          },
          {
            type: 'steps',
            items: [
              'Under **Subscribe**, click **Monthly** or **Yearly**. Above the yearly plan you see how many percent it saves compared to twelve months. Payment opens at Stripe in a new window.',
              'After payment the page shows your key. Click the copy icon next to it to put it on the clipboard. You also receive it by email.',
              'Enter the key under **Key** and click **Unlock**. Upper or lower case does not matter. Pro is available right away, without reloading the page.',
            ],
          },
          {
            type: 'p',
            text: 'While Pro is active, the section shows **Plan**, **Paid until** and the end of the **Key**. **Manage subscription** opens the Stripe customer portal, where you cancel, change the payment method or view invoices. **Remove key** switches Pro off on this computer and frees the slot; the subscription continues.',
          },
          {
            type: 'list',
            items: [
              'Pro needs an internet connection. MixMarket checks the subscription at start and every six hours. If the connection drops, Pro keeps running for at most 24 hours; the section shows the time. If MixMarket starts without a connection, Pro stays off until the connection is back.',
              'Both plans renew automatically by one month or one year until you cancel. A cancellation takes effect at the end of the period; Pro keeps running until then. After cancelling, the section shows **Ends on** instead of **Paid until**, plus a note. Under **Manage subscription** you can undo the cancellation until then.',
              'If the subscription has expired or ended, Pro switches off at the next check. If only a payment is open, settle it under **Manage subscription** and then click **Check now**. For a subscription that has ended, subscribe again and enter the new key.',
              'Some keys are valid without a subscription. Then **Plan** shows “Unlocked without subscription” and **Valid until** shows a date or “Unlimited”; there is no **Manage subscription** for them.',
              'A key runs on at most two computers. For a third one, remove it on one of the two first.',
            ],
          },
          {
            type: 'tip',
            text: 'Every Pro hint in MixMarket has an **Unlock Pro** button that leads straight here. Unlocking, removing and switching off are listed under **Activity** in the **Settings** area.',
          },
        ],
      },
      {
        id: 'forgot-password',
        title: 'Forgot password',
        blocks: [
          {
            type: 'p',
            text: 'If you have forgotten your password, click **Forgot password?** on the sign-in page. You need the recovery key from the first start or the one you created most recently.',
          },
          {
            type: 'steps',
            items: [
              'Enter your **Email** and the **Recovery key**. Upper and lower case, spaces and dashes do not matter for the key.',
              'Enter a password with at least 10 characters under **New password** and repeat it under **Repeat new password**.',
              'Click **Set new password**.',
              'MixMarket shows a new **Recovery key**. The previous one has been used up. Keep the new one as on first start, tick **I have stored the key safely.** and click **Continue to MixMarket**. You are then signed in.',
            ],
          },
          {
            type: 'p',
            text: 'All other sign-ins, for example in a second browser, are signed out. **Back to sign in** returns to the sign-in page without any change.',
          },
          {
            type: 'p',
            text: 'If the key is lost as well, there is an emergency option. It is deliberately hidden on the Forgot password page: in the heading **Forgot password**, click the first "s" in the word "password". The mouse pointer does not change there. The note **Lost the key as well?** then appears with the command. Remember this way, because this handbook cannot be reached without signing in.',
          },
          {
            type: 'steps',
            items: [
              'On the computer MixMarket runs on, open a terminal in the MixMarket folder.',
              'Enter npm run reset-password and press Enter. In the hidden note, the button next to the command copies it to the clipboard.',
              'Enter the new password with at least 10 characters twice. What you type stays invisible.',
              'MixMarket shows a new recovery key. Keep it in a safe place, the old one no longer applies.',
              'Then sign in in the browser with the new password. Previous sign-ins are signed out.',
            ],
          },
          {
            type: 'tip',
            text: 'Either way your data is kept. Only password and key change.',
          },
          {
            type: 'warning',
            text: 'After 5 failed attempts within 15 minutes, sign-in from this network address is locked for 5 minutes. The same applies to wrong keys under **Forgot password?**. The message tells you when you can try again. MixMarket does not lock the account itself. If there were 5 failed attempts for the same account within 15 minutes, from wherever, MixMarket answers every further attempt with a delay, 2 seconds longer with each further failed attempt, at most 10 seconds.',
          },
        ],
      },
      {
        id: 'company',
        title: 'Company',
        blocks: [
          {
            type: 'p',
            text: 'The **Company** section of **Settings** holds your details for sending.',
          },
          {
            type: 'list',
            items: [
              '**Company name**: your company’s name.',
              '**Postal address (required in footer)**: appears in the footer of every email sent. Line breaks are kept. If it is missing, MixMarket warns you before sending and scheduling.',
              '**Signature**: appears in every campaign and follow-up email below the template content, and in every email from the outbox and every reply from **Conversations** below the text. Plain text with name, role and contact details is enough, line breaks are kept. HTML also works. In campaigns, follow-ups and the outbox, links in it are counted like links in the content. If no signature is entered, the outbox and Conversations put your sender name from the mailbox below the closing, or the company name instead. If the signature already contains a closing such as “Viele Grüße”, “Mit freundlichen Grüßen” or “Best regards”, the outbox and Conversations do not add their own closing above it, so it does not appear twice.',
              '**Unsubscribe note German**: the sentence before the link “Hier abmelden” in the footer of emails from templates in German and of emails from the outbox in German. If the field is empty, “Sie möchten keine weiteren E-Mails von uns erhalten?” is shown.',
              '**Unsubscribe note English**: the sentence before the link “Unsubscribe here” in the footer of emails from templates in English and of emails from the outbox in English. If the field is empty, “You no longer wish to receive emails from us?” is shown.',
            ],
          },
          {
            type: 'p',
            text: 'Click **Save** to store the details. MixMarket confirms this with “Company details saved”.',
          },
        ],
      },
      {
        id: 'mailbox',
        title: 'Mailbox',
        blocks: [
          {
            type: 'p',
            text: 'MixMarket sends your emails through the mailbox, and through receiving it reads the replies for **Conversations**. You get the access details from your email provider. Passwords are stored encrypted and never shown.',
          },
          {
            type: 'p',
            text: 'At the top right of the section, a badge shows where sending takes its details from:',
          },
          {
            type: 'terms',
            items: [
              { term: 'Own mailbox set up', text: 'Sending uses the details from this section.' },
              { term: 'Sending via server file', text: 'Sending uses the values from the .env file on the server. As soon as you enter a server here, your details apply.' },
              { term: 'Test mode', text: 'No mailbox is set up. MixMarket does not send real emails.' },
              { term: 'Password unreadable, please enter it again', text: 'A stored password can no longer be decrypted. Enter it again.' },
            ],
          },
        ],
      },
      {
        id: 'smtp',
        title: 'Sending (SMTP)',
        blocks: [
          {
            type: 'p',
            text: 'SMTP is the method used to send emails. Here you enter your provider’s outgoing server.',
          },
          {
            type: 'list',
            items: [
              '**Sender name** and **Sender address**: the mailbox’s sender. New campaigns take both as a suggestion. Emails are sent with the sender entered in the campaign or automation. The outbox always sends with the mailbox’s sender. If no sender address is entered here, MixMarket takes the username if it is an email address.',
              '**Server**: the name of the outgoing server, for example smtp.company.com.',
              '**Encryption**: **SSL/TLS** or **STARTTLS**. When you switch, MixMarket fills in the usual port, 465 for SSL/TLS and 587 for STARTTLS, as long as you have not entered your own port.',
              '**Port**: if left empty, the usual port applies.',
              '**Username** and **Password**: your login with the provider. An empty password field keeps the stored password. The eye icon shows what you typed.',
            ],
          },
          {
            type: 'tip',
            text: 'Below **Sender name** and **Sender address** there is a tip about the sending domain: for first contact, do not use your company’s main domain but a separate sending domain, a second domain is safest, otherwise a subdomain. Set up SPF, DKIM and DMARC for it and start with only a few emails per day. That way your normal business mail stays unaffected if spam filters react.',
          },
          {
            type: 'warning',
            text: 'Without a sender address and without a username in the form of an email address, MixMarket cannot use the access and stays in test mode.',
          },
        ],
      },
      {
        id: 'imap',
        title: 'Receiving (IMAP)',
        blocks: [
          {
            type: 'p',
            text: 'IMAP is the method used to read emails from a mailbox. Here you enter your provider’s incoming server.',
          },
          {
            type: 'list',
            items: [
              '**Server**, **Encryption** and **Port** work as for sending. Usual ports are 993 for SSL/TLS and 143 for STARTTLS.',
              '**Same login as for sending**: if ticked, MixMarket uses the username and password from sending. Otherwise you enter a separate login.',
              '**Folder for replies**: usually INBOX. After a successful test you choose from the existing folders.',
            ],
          },
          {
            type: 'p',
            text: 'MixMarket checks the **Folder for replies** about every 2 minutes and files replies, out-of-office replies and bounces in **Conversations** (Conversations). It opens the mailbox read only: emails stay unread and unchanged, and MixMarket moves and deletes nothing.',
          },
        ],
      },
      {
        id: 'mailbox-test',
        title: 'Test the connection and save',
        blocks: [
          {
            type: 'steps',
            items: [
              'Under sending or receiving, click **Test connection**. Unsaved changes are saved first.',
              'For sending, MixMarket only logs in to the server; no email is sent. For receiving, it opens the folder and counts the messages.',
              'The result appears below the fields. If there is an error, the cause and the full message from the mail server are shown.',
              'Click **Save mailbox** to store your details.',
            ],
          },
          {
            type: 'tip',
            text: 'If the login is rejected, your provider often requires a separate app password. If encryption and port do not match, SSL/TLS usually belongs to port 465 or 993 and STARTTLS to port 587 or 143.',
          },
          {
            type: 'p',
            text: '**Remove access** deletes the sending or receiving access after a confirmation. Without sending access, MixMarket no longer sends real emails; without receiving access, it no longer reads replies.',
          },
        ],
      },
      {
        id: 'provider-access',
        title: 'Research access',
        blocks: [
          {
            type: 'tip',
            text: 'Access to DataForSEO and Serper is part of MixMarket Pro.',
          },
          {
            type: 'p',
            text: 'For the search sources DataForSEO and Serper you need your own account with the provider. OpenStreetMap needs no access. Password and key are stored encrypted and never shown again. An empty field keeps the stored value.',
          },
          {
            type: 'list',
            items: [
              'DataForSEO: enter **API login** and **API password**. The API password is found at DataForSEO under API Access and is not your account password. One access covers business listings and Google search.',
              'The tick **Use test environment (sandbox): sample data, free of charge** returns sample data and costs nothing. Untick it for real searches.',
              '**Check access** tests the DataForSEO access free of charge and shows your balance.',
              'Serper: enter the **API key**. **Check key (uses 1 query)** tests it.',
              '**Create account** opens the provider’s website; **Remove access** deletes an access after a confirmation.',
              '**Cost limit per search**: searches estimated above this amount are not started. 0 to 100 USD are allowed; the default is 1 USD.',
            ],
          },
          {
            type: 'p',
            text: 'Click **Save access**. Only check the access afterwards, because the test uses the stored details.',
          },
        ],
      },
      {
        id: 'ai',
        title: 'AI rating',
        blocks: [
          {
            type: 'p',
            text: 'The AI uses your existing subscription through a program installed and signed in on the computer running MixMarket. No API key is needed.',
          },
          {
            type: 'steps',
            items: [
              'Under **Subscription**, choose **Claude subscription** or **ChatGPT subscription**. The Claude subscription requires Claude Code to be installed and signed in, the ChatGPT subscription requires Codex.',
              'Under **Model**, pick the model from the list. The preset is **Subscription default**. Your subscription decides which model that is, MixMarket cannot read it. Your own settings in Claude Code or Codex do not apply here. For emails a smaller model is usually enough, it is faster and uses less of your subscription. With the Claude subscription you can also choose **Opus**, **Sonnet** and **Haiku**, with the ChatGPT subscription the models Codex knows for your signed-in subscription. If MixMarket cannot find that list, only the default is shown. If you switch the subscription, the model goes back to **Subscription default**. A model name you entered by hand earlier stays selectable.',
              'Click **Check connection**.',
              'Click **Save AI settings**. Only then can a rating be started.',
            ],
          },
          {
            type: 'p',
            text: 'The same AI also writes the emails in the **Outbox**, sorts the replies in **Conversations** and writes reply drafts there. Without a saved provider, the outbox creates no emails and replies are not sorted.',
          },
          {
            type: 'p',
            text: 'How heavily the selected subscription is used, and from which usage the AI pauses, you see and control on the **Overview** (Overview, Usage and AI pause).',
          },
          {
            type: 'p',
            text: 'What you sell and who your ideal customer is are kept per product in Research under **Manage products**. The link **Go to Research** takes you there.',
          },
          {
            type: 'tip',
            text: 'The AI gets no tools and cannot run anything on the computer.',
          },
        ],
      },
      {
        id: 'appearance-language',
        title: 'Appearance and language',
        blocks: [
          {
            type: 'list',
            items: [
              '**Theme**: **Dark** or **Light**. The change takes effect immediately.',
              '**Language**: DE for German or EN for English. The change takes effect immediately.',
            ],
          },
          {
            type: 'p',
            text: 'You can also switch both at any time in the top bar. MixMarket remembers your choice in this browser. The interface language does not affect your emails. You set their language per template under **Email language**, in the outbox per product under **Language of the emails**.',
          },
        ],
      },
      {
        id: 'updates',
        title: 'Updates',
        blocks: [
          {
            type: 'p',
            text: 'Once a day MixMarket looks on GitHub for a newer version. It only reads the public version number and the list of changes and sends nothing about you. When a new version is out, a small pulsing dot appears on your initials at the top right, and the user menu shows **Update available**.',
          },
          {
            type: 'list',
            items: [
              '**Update available** opens a window with the new version number, the changes since your version under **What is new** and the steps under **How to update**. Copy the commands with the copy icon next to them.',
              '**Check for updates** asks GitHub right away. If your version is current, it says **You are using the latest version.** with the time of the last check and the button **Check again**.',
              'If GitHub cannot be reached, for example without an internet connection, MixMarket says so in the window. Your work carries on unaffected.',
            ],
          },
          {
            type: 'tip',
            text: 'MixMarket never updates itself. You decide when to run the commands. Your data and settings are kept.',
          },
        ],
      },
    ],
  },
  {
    id: 'search',
    title: 'Search',
    summary: 'The search looks through all areas of MixMarket at once and jumps straight to the item found.',
    sections: [
      {
        id: 'open',
        title: 'Open the search',
        blocks: [
          {
            type: 'p',
            text: 'Click **Search** in the top bar or press Cmd K on a Mac or Ctrl K on Windows and Linux. The **Search** button shows the right shortcut for your device. The same shortcut or Esc closes the search again.',
          },
          {
            type: 'p',
            text: 'Without input, the search lists all pages of MixMarket for quick jumping. As you type, the pages are filtered by name. From two characters on, MixMarket also searches all areas.',
          },
        ],
      },
      {
        id: 'what-is-searched',
        title: 'What is searched',
        blocks: [
          {
            type: 'p',
            text: 'Upper and lower case and spaces do not matter. The search covers:',
          },
          {
            type: 'list',
            items: [
              'Contacts: name, email, company, position, sector, website, country and note.',
              'Companies: name, website, email, phone, address, category, contact persons, the AI angle and reasoning, and the website text.',
              'Prospects: company, contact person and note.',
              'Outbox: company, subject, recipient address and text of the emails.',
              'Conversations: sender name and address, subject and text of incoming emails, including bounces and out-of-office replies.',
              'Products: name, website, description and ideal customer.',
              'Lists and target groups: name and description.',
              'Templates: name, subject, content and plain text.',
              'Campaigns and automations: name, subject and sender.',
              'Company searches: search term and place.',
              'Website jobs: name.',
              'Suppression list: email and note.',
              'Handbook: title and text of all sections. Clicking a result opens the handbook at exactly that spot.',
            ],
          },
        ],
      },
      {
        id: 'areas',
        title: 'Areas and result counts',
        blocks: [
          {
            type: 'p',
            text: 'Below the input field, **Found in** shows the areas with results and their count. **All** shows the results of all areas; clicking an area shows only its results.',
          },
          {
            type: 'list',
            items: [
              'Each result shows title, subtitle and where it was found, with the field containing the term. The term is highlighted.',
              'Up to five results per area are shown at first. If there are more, the entry at the end of the area opens the further results of that area.',
              'Esc in a chosen area takes you back to all areas.',
            ],
          },
        ],
      },
      {
        id: 'jump',
        title: 'Jump to an item',
        blocks: [
          {
            type: 'p',
            text: 'Use the arrow keys to select an entry and Enter or a click to open it. MixMarket opens the right page and the item itself:',
          },
          {
            type: 'list',
            items: [
              'Contacts, lists, templates and automations open for editing.',
              'Drafts and older cancelled campaigns open for editing; other campaigns are highlighted in the list.',
              'Companies open in the detail view, company searches with their list of companies.',
              'Target groups, prospects and products open in Research, with the matching product selected.',
              'Outbox emails open in the matching tab, with the product selection set to **All products**. On narrow screens the email opens in a window.',
              'Conversations open in **Conversations** in the **All** view with the conversation found, on narrow screens in a window.',
              'Website jobs open their results; suppression entries are highlighted.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'legal',
    title: 'Law and deliverability',
    summary: 'What you should consider legally, and how MixMarket handles required details, unsubscribing, sign-in protection and test mode.',
    sections: [
      {
        id: 'disclaimer',
        title: 'First of all',
        blocks: [
          {
            type: 'warning',
            text: 'This chapter is not legal advice. It describes how MixMarket works and names points you should check. Whether an approach is permitted in your case is something you need to clarify yourself or with a legal adviser.',
          },
        ],
      },
      {
        id: 'consent',
        title: 'Consent',
        blocks: [
          {
            type: 'p',
            text: 'In Germany, email advertising without the recipient’s prior express consent is generally not permitted under UWG § 7, also towards businesses. There are only narrow exceptions, for example for your own existing customers under certain conditions. Data protection rules also apply to your contacts’ data. Other countries have their own rules.',
          },
          {
            type: 'p',
            text: 'The tick **Consent documented** records on the contact that you have consent. MixMarket only stores this statement, not the proof itself. Keep the proof separately.',
          },
        ],
      },
      {
        id: 'research-without-consent',
        title: 'Contacts from research',
        blocks: [
          {
            type: 'p',
            text: 'Companies from research have not given you consent. When you add prospects to the contacts, they get the source “research” and no consent.',
          },
          {
            type: 'p',
            text: 'Before you send or schedule a campaign, MixMarket checks the recipients. If recipients have no documented consent, the notice gives their number and how many of them come from research. Sending remains possible; the decision and the responsibility are yours.',
          },
          {
            type: 'p',
            text: 'These warnings also apply to the outbox. There, MixMarket warns you when you use **Contact**, above the list in the **To approve** tab and for **Approve all**, and every affected email carries the label **No consent**. Here too, you decide yourself whether to approve an email.',
          },
          {
            type: 'warning',
            text: 'The notice counts all recipients without the tick **Consent documented**, including contacts from **Read web pages**, from an import or added by hand. Email advertising without consent may be unlawful under German UWG § 7.',
          },
          {
            type: 'warning',
            text: 'The Writing autopilot creates emails to companies from research, that is to recipients without documented consent, without you choosing each company. This does not change the risk under German UWG § 7. Keep **Approve every email before sending** ticked in the product’s **Sequence** and check every email (Overview, Autopilot).',
          },
          {
            type: 'tip',
            text: 'Research is also useful without sending emails: the prospect list shows phone number and angle, for example for a call.',
          },
        ],
      },
      {
        id: 'footer',
        title: 'Required details in the footer',
        blocks: [
          {
            type: 'p',
            text: 'MixMarket appends a footer to every email from campaigns, automations and the outbox. It contains your **Postal address (required in footer)** from the settings with its line breaks, plus the unsubscribe note and unsubscribe link in the template language, in the outbox in the sequence’s **Language of the emails**: the **Unsubscribe note German** with the link “Hier abmelden” or the **Unsubscribe note English** with the link “Unsubscribe here”. Your **Signature** sits above it, if entered.',
          },
          {
            type: 'p',
            text: 'Your personal replies in **Conversations** have no such footer. They contain your signature and your postal address if entered, but no unsubscribe link.',
          },
          {
            type: 'warning',
            text: 'If no postal address is entered, it is missing from the footer. MixMarket points this out before sending and scheduling, but does not prevent sending. Enter the address before your first send. Which further details your business emails must contain, for example under commercial law, you need to check yourself.',
          },
        ],
      },
      {
        id: 'unsubscribe',
        title: 'Unsubscribing',
        blocks: [
          {
            type: 'p',
            text: 'Every email from campaigns, automations and the outbox contains an unsubscribe link, including every follow-up email. Your personal replies in **Conversations** are the exception. MixMarket also sends a technical unsubscribe header so that email programs can show their own unsubscribe button. Unsubscribing takes effect immediately: the address goes on the suppression list, the contact is unsubscribed, and open prospects switch to Not interested.',
          },
          {
            type: 'p',
            text: 'Suppressed addresses no longer receive campaigns, follow-up emails, emails from the outbox or replies from **Conversations**, and running sequences in the outbox end.',
          },
          {
            type: 'p',
            text: 'If a recipient asks in a reply for no further emails or for their data to be deleted, the AI sorts the reply in **Conversations** as **Unsubscribe**, as long as the Replies autopilot is switched on. MixMarket then puts the address on the suppression list as with an unsubscribe via the link, and the contact is unsubscribed (Conversations, Sorting by the AI). Without AI, with the Replies autopilot switched off or if the category is wrong, choose **Unsubscribe** under **Category** yourself. If someone unsubscribes another way, for example by phone, add them to the suppression list yourself with **Suppress address**.',
          },
          {
            type: 'p',
            text: 'Every unsubscribe via the link and every new suppression because of an unsubscribe request by reply appears as a notice under **Waiting for you** on the Overview. MixMarket does not send you an email about it.',
          },
          {
            type: 'warning',
            text: 'The AI category can be wrong. Check replies in **Conversations** regularly so that no unsubscribe request is missed. MixMarket does not delete data by itself; a deletion request remains your task.',
          },
        ],
      },
      {
        id: 'tracking',
        title: 'Opens and clicks',
        blocks: [
          {
            type: 'p',
            text: 'To count opens, every email from campaigns, automations and the outbox contains an invisible image. Links are redirected through MixMarket to count clicks. The time, IP address and browser identifier of the recipient are stored in the process. For replies in **Conversations**, MixMarket counts neither opens nor clicks.',
          },
          {
            type: 'p',
            text: 'The redirected links are signed. Only a target that MixMarket itself wrote into the email opens directly. If a link has been changed or is not signed, for example in emails sent before version 0.14.1, MixMarket shows a short intermediate page “You are about to open an external page” with the target to click through, in German or English depending on the recipient’s browser. Such a visit does not count as a click.',
          },
          {
            type: 'p',
            text: 'MixMarket stores repeated opens of the same email within one hour only once, and likewise repeated clicks on the same link within one minute.',
          },
          {
            type: 'tip',
            text: 'Check whether and how you need to inform your recipients about this, for example in your privacy policy.',
          },
        ],
      },
      {
        id: 'sign-in-protection',
        title: 'Sign-in protection',
        blocks: [
          {
            type: 'p',
            text: 'MixMarket holds personal data of your contacts. It protects access to this data as follows:',
          },
          {
            type: 'list',
            items: [
              'There is exactly one account. Its password needs at least 10 characters. Password and recovery key are not stored in plain text.',
              'After 5 failed attempts within 15 minutes, sign-in from this network address is locked for 5 minutes, and so is **Forgot password?** after 5 wrong keys.',
              'The account itself is not locked, so that nobody can lock you out on purpose. After 5 failed attempts for the account within 15 minutes, from wherever, MixMarket answers every further attempt with a delay of up to 10 seconds.',
              'After a password change or a reset, other sign-ins are no longer valid. **Sign out** ends all sign-ins on all devices.',
              'Sign-ins, failed attempts, locks and account changes are recorded in the activity log.',
            ],
          },
          {
            type: 'tip',
            text: 'Use a password you do not use anywhere else, and keep the recovery key separate from the computer.',
          },
        ],
      },
      {
        id: 'test-mode',
        title: 'Test mode',
        blocks: [
          {
            type: 'p',
            text: 'As long as no mailbox is set up, MixMarket runs in test mode. Campaigns, automations, the outbox and replies in **Conversations** run as usual and count as sent, but the emails are only noted in the server log and not sent.',
          },
          {
            type: 'tip',
            text: 'Use test mode to try out workflows. Then, with a mailbox set up, send a campaign to a list that contains only your own address, and check greeting, angle, links and footer in the real email.',
          },
          {
            type: 'warning',
            text: 'In test mode, emails count as sent. A campaign cannot then be sent to the same recipients again, and active automations already queue recipients. Create new campaigns for the real send. A prospect the outbox has written to in test mode cannot be contacted there again.',
          },
        ],
      },
      {
        id: 'deliverability',
        title: 'Deliverability',
        blocks: [
          {
            type: 'p',
            text: 'To help your emails arrive rather than land in spam, MixMarket pauses briefly between two emails and sends an automatically created plain text version with every email. Some things are up to you:',
          },
          {
            type: 'list',
            items: [
              'In campaigns, use your mailbox’s address as the sender address. Many providers reject foreign sender addresses or treat them as spam.',
              'Write to a few well-matched recipients rather than many unsuitable ones. The AI fit helps you choose.',
              'Keep a balance between text and links and avoid sensational subject lines.',
              'In the outbox, the **Sending rules** control on which days, at what times, how many and at what interval emails go out.',
              'How many emails of a campaign failed, and the first error message, are shown in **Activity**. MixMarket suppresses permanently undeliverable addresses itself as soon as a bounce arrives and receiving (IMAP) is set up (Conversations, Bounces). Without receiving, suppress such addresses yourself with the reason Bounced.',
              'If permanent bounces pile up, MixMarket triggers the automatic emergency stop and halts all sending until you release it. You set the limit on the Overview under **Emergency stop at bounce rate** (Overview, Emergency stop).',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'glossary',
    title: 'Glossary',
    summary: 'Short explanations of the most important terms in MixMarket.',
    sections: [
      {
        id: 'terms',
        title: 'Terms from A to Z',
        blocks: [
          {
            type: 'terms',
            items: [
              { term: 'Account', text: 'Your access to MixMarket with name, email and password. There is exactly one account, managed in the settings under Account.' },
              { term: 'Activity log', text: 'List of everything that happens in MixMarket, with time and actor, available via Activity in the user menu.' },
              { term: 'AI pause', text: 'Automatic pause of the AI as soon as the selected subscription reaches the set usage. Rating, outbox and Conversations wait and continue after the pause.' },
              { term: 'AI rating', text: 'Rating of analysed companies by the AI: fit from 1 to 10, reasoning, angle and estimated size.' },
              { term: 'Analyse', text: 'Reading the public pages of a company website to obtain contact persons, email addresses and signals. Free and without AI.' },
              { term: 'Angle', text: 'One or two sentences from the AI for the first personal approach to a company, matching the product. Can be inserted in templates with the placeholder {{ansatz}}.' },
              { term: 'Automation', text: 'Rule that automatically sends a follow-up email after a campaign when a trigger such as a click or open applies.' },
              { term: 'Autopilot', text: 'Switches per area on the Overview with which MixMarket handles research, writing, sending and replies by itself.' },
              { term: 'Bounce', text: 'A mail server’s message that an email could not be delivered. With a permanent bounce, MixMarket suppresses the address with the reason Bounced.' },
              { term: 'Campaign', text: 'Sending a template to the contacts of selected lists, now or scheduled.' },
              { term: 'Category', text: 'Assessment of a reply in Conversations by the AI or by you: Interested, Question, Not interested, Unsubscribe or Other. Not interested and Unsubscribe change prospect, contact and suppression list.' },
              { term: 'Company search', text: 'Search for businesses of one trade in one place through a source, in the Find companies tab.' },
              { term: 'Consent', text: 'A recipient’s agreement to receive email advertising. Recorded in MixMarket as a tick on the contact.' },
              { term: 'Contact', text: 'A recipient with an email address and further details such as name, salutation and company.' },
              { term: 'Conversation', text: 'All incoming emails of a contact together with your emails to them, in the Conversations area. Without a contact, MixMarket groups by sender address.' },
              { term: 'Emergency stop', text: 'Immediately stops all sending from outbox, campaigns, automations and Conversations. Triggered manually on the Overview or automatically when there are too many bounces, lifted with Release sending.' },
              { term: 'First email', text: 'The first personal email the AI writes to a prospect in the outbox.' },
              { term: 'Fit', text: 'A number from 1 to 10 showing how well a company suits a product according to the AI.' },
              { term: 'Follow-up email', text: 'Email that follows up on a first email: in an automation after a campaign, in the outbox as a reply to the first email in the same thread.' },
              { term: 'Ideal customer', text: 'Your description of which businesses suit a product well and which do not. The basis of the fit.' },
              { term: 'IMAP', text: 'Method for reading emails from a mailbox. Your provider’s incoming server. MixMarket reads the replies for Conversations through it.' },
              { term: 'Initial setup', text: 'Creating the only account on the very first start, on the page Set up MixMarket. MixMarket then shows the recovery key once.' },
              { term: 'List', text: 'A group of contacts. Campaigns always go to one or more lists.' },
              { term: 'Mailbox', text: 'Your email account that MixMarket sends through and reads replies from. Entered in the settings.' },
              { term: 'Minimum size', text: 'Number of employees from which a product fits. Clearly smaller companies get a fit of 3 at most.' },
              { term: 'Out-of-office reply', text: 'Automatic reply such as a holiday or absence message. MixMarket recognises it in Conversations; it does not end a sequence in the outbox.' },
              { term: 'Outbox', text: 'Area in which the AI writes personal emails to individual prospects, which you approve before sending.' },
              { term: 'Placeholder', text: 'An expression in double curly braces, such as {{firstName}}, that is replaced with the recipient’s data when sending.' },
              { term: 'Product', text: 'What you sell. Target groups, AI ratings and prospects apply per product.' },
              { term: 'Prospect', text: 'A company you want to approach for a particular product, with status and note.' },
              { term: 'Prospect list', text: 'List that MixMarket creates per product when you add prospects to the contacts or contact them. {{ansatz}} finds the angle through it.' },
              { term: 'Recovery key', text: 'A key of 6 groups of 4 characters that lets you set a new password if you forget yours. It is shown only once and works for exactly one recovery.' },
              { term: 'Sending window', text: 'Sending days and times in which the outbox sends emails. Set under Sending rules.' },
              { term: 'Sequence', text: 'Series of a first email and up to three follow-ups that the outbox sends to a prospect. Set per product under Sequence.' },
              { term: 'Signal', text: 'A property of a company, such as “Hiring” or “Has contact form”, that you use to build target groups.' },
              { term: 'SMTP', text: 'Method for sending emails. Your provider’s outgoing server.' },
              { term: 'Source', text: 'The service the company search uses to find businesses: OpenStreetMap, DataForSEO or Serper.' },
              { term: 'Suppression list', text: 'Addresses that are never written to again, for example after an unsubscribe.' },
              { term: 'Target group', text: 'A saved selection of companies based on signals, per product.' },
              { term: 'Test mode', text: 'State without a mailbox set up. Campaigns, the outbox and replies in Conversations run, but no real emails are sent.' },
              { term: 'Usage', text: 'How heavily an AI subscription is used over 5 hours and over the week, in per cent. The Overview shows it for the Claude and ChatGPT subscriptions, plus AI calls, sending and bounces.' },
            ],
          },
        ],
      },
    ],
  },
]
