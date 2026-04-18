import { CampaignNewPage } from '@/features/campaigns/components/CampaignNewPage'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function CampaignNewRoute({ params }: Props) {
  const { workspaceId } = await params
  return <CampaignNewPage workspaceId={workspaceId} />
}
