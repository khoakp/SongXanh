import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ScenarioOption = { id: string; label: string }

export async function GET() {
  const supabase = await createClient()
  const { data: scenarios, error } = await supabase
    .from('game_scenarios')
    .select('id,slug,title,description')
    .eq('active', true)
    .order('created_at')
    .limit(2)

  if (error) {
    return NextResponse.json({ error: 'Không thể tải kịch bản.' }, { status: 500 })
  }

  const scenarioIds = (scenarios ?? []).map((scenario) => scenario.id)
  const { data: steps } = scenarioIds.length
    ? await supabase.from('game_scenario_steps').select('id,scenario_id,step_order,prompt,options').in('scenario_id', scenarioIds).order('step_order')
    : { data: [] }

  const safeSteps = (steps ?? []).map((step) => ({
    id: step.id,
    scenarioId: step.scenario_id,
    stepOrder: step.step_order,
    prompt: step.prompt,
    options: (Array.isArray(step.options) ? step.options : []).map((option: ScenarioOption) => ({ id: option.id, label: option.label })),
  }))

  return NextResponse.json({ scenarios: scenarios ?? [], steps: safeSteps })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Vui lòng đăng nhập để chơi.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as { scenarioId?: string; choices?: string[] } | null

  if (!body?.scenarioId || !Array.isArray(body.choices) || body.choices.some((choice) => typeof choice !== 'string')) {
    return NextResponse.json({ error: 'Lựa chọn không hợp lệ.' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('submit_scenario_secure', {
    p_scenario_id: body.scenarioId,
    p_choices: body.choices.map((optionId) => ({ optionId })),
  })

  if (error) {
    return NextResponse.json({ error: 'Không thể ghi nhận kết quả.' }, { status: 400 })
  }

  return NextResponse.json(data)
}
