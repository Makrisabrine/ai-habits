import { requireUser } from "@/lib/auth";
import { getConversation } from "@/lib/chat";
import { Chat } from "@/components/chat";
import { PageTitle } from "@/components/ui";

export default async function CoachPage() {
  const user = await requireUser();
  const messages = await getConversation(user.id);

  return (
    <>
      <PageTitle
        title="Coach IA"
        subtitle="Il connaît tes 7 derniers jours et tes corrélations détectées."
      />
      <Chat initialMessages={messages} />
    </>
  );
}
