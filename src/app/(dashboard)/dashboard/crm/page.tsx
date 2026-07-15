import { Contact } from "lucide-react"

import { getContacts, getUserMemberships } from "@/lib/dal"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export default async function CRMPage() {
  const orgs = await getUserMemberships()
  const org = orgs[0]

  if (!org) {
    return null
  }

  const contacts = await getContacts(org.id)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">CRM</h1>
        <p className="text-sm text-muted-foreground">
          Contacts are created automatically by automations — e.g. tagged when someone buys
          through a funnel.
        </p>
      </div>

      {contacts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Contact className="size-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No contacts yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Set up an automation to tag contacts when a funnel is purchased.
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col divide-y p-0">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                <div className="flex flex-col">
                  <span className="font-medium">{contact.name ?? contact.email}</span>
                  <span className="text-muted-foreground">{contact.email}</span>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {contact.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
