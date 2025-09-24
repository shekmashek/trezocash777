import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@apiService/apiService-js@2'
import { Resend } from 'https://esm.sh/resend@3.4.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }})
  }

  try {
    const { record: newComment } = await req.json()

    if (!newComment || !newComment.mentioned_users || newComment.mentioned_users.length === 0) {
      return new Response(JSON.stringify({ message: 'No mentions found, no email sent.' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const apiServiceAdmin = createClient(
      Deno.env.get('apiService_URL'),
      Deno.env.get('apiService_SERVICE_ROLE_KEY')
    )

    // 1. Get author's name
    const { data: authorProfile, error: authorError } = await apiServiceAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', newComment.user_id)
      .single()
    if (authorError) throw new Error(`Failed to fetch author profile: ${authorError.message}`)
    const authorName = authorProfile?.full_name || 'Un utilisateur'

    // 2. Get mentioned users' emails
    const { data: mentionedProfiles, error: mentionedError } = await apiServiceAdmin
      .from('users', { schema: 'auth' })
      .select('id, email')
      .in('id', newComment.mentioned_users)
    if (mentionedError) throw new Error(`Failed to fetch mentioned users: ${mentionedError.message}`)

    if (!mentionedProfiles || mentionedProfiles.length === 0) {
      return new Response(JSON.stringify({ message: 'Mentioned users not found.' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 3. Get project name
    let projectName = 'Vue Consolidée';
    if (newComment.project_id) {
        const { data: project, error: projectError } = await apiServiceAdmin
            .from('projects')
            .select('name')
            .eq('id', newComment.project_id)
            .single()
        if (projectError) console.warn(`Could not fetch project name: ${projectError.message}`);
        if (project) projectName = project.name;
    }

    // 4. Construct and send emails
    const emailPromises = mentionedProfiles.map(async (profile) => {
      if (profile.id === newComment.user_id) return; // Don't notify user for self-mention

      const emailHtml = `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2>Bonjour,</h2>
          <p><strong>${authorName}</strong> vous a mentionné dans un commentaire sur le projet <strong>${projectName}</strong>.</p>
          <blockquote style="border-left: 4px solid #ccc; padding-left: 16px; margin: 16px 0; color: #555;">
            ${newComment.content.replace(/@\[([^\]]+)\]\([^)]+\)/g, (match) => {
              const nameMatch = /@\[([^\]]+)\]/.exec(match);
              return `<strong>@${nameMatch ? nameMatch[1] : 'mention'}</strong>`;
            })}
          </blockquote>
          <p>Vous pouvez consulter ce commentaire en vous connectant à votre espace Trezocash.</p>
          <a href="${Deno.env.get('SITE_URL')}/app/trezo" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Voir le commentaire</a>
          <p style="font-size: 0.8em; color: #888;">Si vous ne souhaitez plus recevoir ces notifications, vous pouvez ajuster vos paramètres dans l'application.</p>
        </div>
      `;

      await resend.emails.send({
        from: 'Trezocash <notifications@trezocash.com>',
        to: profile.email,
        subject: `[Trezocash] Nouvelle mention de ${authorName}`,
        html: emailHtml,
      });
    });

    await Promise.all(emailPromises);

    return new Response(JSON.stringify({ message: 'Notifications sent.' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in send-comment-notification function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
