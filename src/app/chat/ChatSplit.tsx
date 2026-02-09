"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  initialQuestion: string;
  mode?: string;
};

const DUMMY_ANSWER = [
  "아래 내용은 예시 답변이며, 실제 사건관계/증빙에 따라 결론이 달라질 수 있습니다.\n\n",
  "1) 쟁점 정리\n",
  "- 현재 상황에서 핵심은 ‘근로자성’, ‘임금(퇴직금) 산정’, ‘해고/징계 절차’ 여부가 될 가능성이 큽니다.\n\n",
  "2) 확인이 필요한 사실\n",
  "- 근로계약서/업무지시 방식, 출퇴근 및 근태관리 여부\n",
  "- 임금명세서, 4대보험 가입, 업무 독립성/대체가능성\n\n",
  "3) 권장 다음 단계\n",
  "- 관련 자료(계약서/급여내역/문자·메일 지시)를 시간순으로 정리\n",
  "- 상대방과의 대화는 문서로 남기기(메일/문자)\n\n",
  "원하시면 사건관계(기간/직무/급여/원하는 결과)를 더 구체적으로 알려주시면, 단계별 대응안을 더 정확히 드리겠습니다.",
];

export function ChatSplit({ initialQuestion, mode }: Props) {
  const router = useRouter();
  const [followUp, setFollowUp] = React.useState("");
  const [answer, setAnswer] = React.useState("");
  const [ctaOpen, setCtaOpen] = React.useState(false);

  type ConsultType = "personal" | "business";
  type ModalStep = "chooseType" | "typePicked" | "options";

  const [consultType, setConsultType] = React.useState<ConsultType | null>(null);
  const [modalStep, setModalStep] = React.useState<ModalStep>("chooseType");
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);

  const stepTimerRef = React.useRef<number | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    contactPerson: "",
    preferredTime: "",
    headcount: "",
    serviceNeeds: "",
    deliveryMethod: "",
    details: "",
  });
  const [submitState, setSubmitState] = React.useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [submitMessage, setSubmitMessage] = React.useState<string>("");

  // "스트리밍" 더미 효과: 일정 간격으로 텍스트를 붙여나감
  React.useEffect(() => {
    let cancelled = false;
    setAnswer("");

    (async () => {
      for (const chunk of DUMMY_ANSWER) {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 220));
        if (cancelled) return;
        setAnswer((prev) => prev + chunk);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialQuestion]);

  // 모달이 닫히거나 언마운트될 때 타이머 정리
  React.useEffect(() => {
    return () => {
      if (stepTimerRef.current) window.clearTimeout(stepTimerRef.current);
    };
  }, []);

  const resetCtaFlow = React.useCallback(() => {
    if (stepTimerRef.current) window.clearTimeout(stepTimerRef.current);
    stepTimerRef.current = null;
    setConsultType(null);
    setModalStep("chooseType");
    setSelectedOption(null);
    setSubmitState("idle");
    setSubmitMessage("");
    setForm({
      name: "",
      phone: "",
      email: "",
      company: "",
      contactPerson: "",
      preferredTime: "",
      headcount: "",
      serviceNeeds: "",
      deliveryMethod: "",
      details: "",
    });
  }, []);

  const openCtaModal = () => {
    resetCtaFlow();
    setCtaOpen(true);
  };

  const pickType = (t: ConsultType) => {
    if (stepTimerRef.current) window.clearTimeout(stepTimerRef.current);
    setConsultType(t);
    setModalStep("typePicked");
    setSelectedOption(null);
    setSubmitState("idle");
    setSubmitMessage("");
    setForm((prev) => ({ ...prev, details: "" }));

    stepTimerRef.current = window.setTimeout(() => {
      setModalStep("options");
    }, 1300);
  };

  const submitRequest = async () => {
    if (!selectedOption) return;
    setSubmitState("submitting");
    setSubmitMessage("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: selectedOption,
          data: {
            ...form,
            mode: mode ?? null,
            initialQuestion: initialQuestion ?? null,
          },
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; details?: string }
        | null;

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed");
      }

      setSubmitState("success");
      setSubmitMessage("접수되었습니다. 담당자가 확인 후 연락드리겠습니다.");
      // 짧게 성공 메시지를 보여준 뒤 닫기
      window.setTimeout(() => setCtaOpen(false), 700);
    } catch (e) {
      setSubmitState("error");
      setSubmitMessage(
        e instanceof Error ? e.message : "제출 중 오류가 발생했습니다."
      );
    }
  };

  const onFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = followUp.trim();
    if (!q) return;
    router.push(`/chat?q=${encodeURIComponent(q)}&mode=${encodeURIComponent(mode ?? "")}`);
  };

  const renderInlineForm = () => {
    if (!selectedOption) return null;

    const commonPersonal = (
      <>
        <div className="grid gap-1.5">
          <Label htmlFor="p_name">이름</Label>
          <Input
            id="p_name"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            placeholder="홍길동"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="p_phone">연락처</Label>
          <Input
            id="p_phone"
            value={form.phone}
            onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
            placeholder="010-0000-0000"
            className="rounded-xl"
          />
        </div>
      </>
    );

    const commonBusiness = (
      <>
        <div className="grid gap-1.5">
          <Label htmlFor="b_company">회사명</Label>
          <Input
            id="b_company"
            value={form.company}
            onChange={(e) => setForm((s) => ({ ...s, company: e.target.value }))}
            placeholder="주식회사 예시"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="b_contact">담당자</Label>
          <Input
            id="b_contact"
            value={form.contactPerson}
            onChange={(e) => setForm((s) => ({ ...s, contactPerson: e.target.value }))}
            placeholder="홍길동"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="b_phone">연락처</Label>
          <Input
            id="b_phone"
            value={form.phone}
            onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
            placeholder="010-0000-0000"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="b_email">이메일</Label>
          <Input
            id="b_email"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            placeholder="hr@example.com"
            className="rounded-xl"
          />
        </div>
      </>
    );

    if (selectedOption === "personal_call") {
      return (
        <>
          {commonPersonal}
          <div className="grid gap-1.5">
            <Label htmlFor="p_time">희망 상담 시간</Label>
            <Input
              id="p_time"
              value={form.preferredTime}
              onChange={(e) => setForm((s) => ({ ...s, preferredTime: e.target.value }))}
              placeholder="예: 오늘 19시 이후 / 이번 주 토 오전"
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p_details">상황 요약</Label>
            <Textarea
              id="p_details"
              value={form.details}
              onChange={(e) => setForm((s) => ({ ...s, details: e.target.value }))}
              placeholder="기간/직무/임금/상대방 주장/원하는 결과를 적어주세요."
              className="min-h-[108px] rounded-xl"
            />
          </div>
        </>
      );
    }

    if (selectedOption === "personal_quote") {
      return (
        <>
          {commonPersonal}
          <div className="grid gap-1.5">
            <Label htmlFor="p_email">이메일(선택)</Label>
            <Input
              id="p_email"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              placeholder="example@email.com"
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p_quote_details">원하시는 도움</Label>
            <Textarea
              id="p_quote_details"
              value={form.details}
              onChange={(e) => setForm((s) => ({ ...s, details: e.target.value }))}
              placeholder="어떤 도움이 필요하신가요? (예: 부당해고 구제/체불임금/퇴직금/산재 등)"
              className="min-h-[108px] rounded-xl"
            />
          </div>
        </>
      );
    }

    if (selectedOption === "biz_call") {
      return (
        <>
          {commonBusiness}
          <div className="grid gap-1.5">
            <Label htmlFor="b_headcount">직원 수(대략)</Label>
            <Input
              id="b_headcount"
              value={form.headcount}
              onChange={(e) => setForm((s) => ({ ...s, headcount: e.target.value }))}
              placeholder="예: 35"
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="b_time">희망 상담 시간</Label>
            <Input
              id="b_time"
              value={form.preferredTime}
              onChange={(e) => setForm((s) => ({ ...s, preferredTime: e.target.value }))}
              placeholder="예: 내일 오전 10-12시"
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="b_details">상담 내용</Label>
            <Textarea
              id="b_details"
              value={form.details}
              onChange={(e) => setForm((s) => ({ ...s, details: e.target.value }))}
              placeholder="이슈 요약(노무리스크/징계/임금체계/노사협의 등)을 적어주세요."
              className="min-h-[108px] rounded-xl"
            />
          </div>
        </>
      );
    }

    if (selectedOption === "biz_quote") {
      return (
        <>
          {commonBusiness}
          <div className="grid gap-1.5">
            <Label htmlFor="b_service">필요 서비스</Label>
            <Input
              id="b_service"
              value={form.serviceNeeds}
              onChange={(e) => setForm((s) => ({ ...s, serviceNeeds: e.target.value }))}
              placeholder="예: 월자문 / 급여·4대보험 / 규정정비"
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="b_quote_details">요청 사항</Label>
            <Textarea
              id="b_quote_details"
              value={form.details}
              onChange={(e) => setForm((s) => ({ ...s, details: e.target.value }))}
              placeholder="견적에 반영해야 할 내용을 적어주세요."
              className="min-h-[108px] rounded-xl"
            />
          </div>
        </>
      );
    }

    // biz_brochure
    return (
      <>
        {commonBusiness}
        <div className="grid gap-1.5">
          <Label htmlFor="b_delivery">소개서 수신 방법</Label>
          <Input
            id="b_delivery"
            value={form.deliveryMethod}
            onChange={(e) => setForm((s) => ({ ...s, deliveryMethod: e.target.value }))}
            placeholder="예: 이메일 / 담당자 휴대폰 문자"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="b_brochure_details">추가 요청(선택)</Label>
          <Textarea
            id="b_brochure_details"
            value={form.details}
            onChange={(e) => setForm((s) => ({ ...s, details: e.target.value }))}
            placeholder="원하시는 소개 범위/자료가 있으면 적어주세요."
            className="min-h-[108px] rounded-xl"
          />
        </div>
      </>
    );
  };

  return (
    <div className="h-screen w-full bg-white text-slate-900">
      <div className="grid h-full grid-cols-2">
        {/* Left */}
        <section className="relative flex h-full flex-col border-r border-slate-200">
          <header className="px-6 pt-6">
            <div className="text-xs font-medium text-slate-500">
              사용자 질문{mode ? ` · ${mode}` : ""}
            </div>
          </header>

          <div className="flex-1 overflow-auto px-6 pb-28 pt-4">
            <div className="max-w-[85%] rounded-2xl bg-[color:var(--brand-muted)] px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm">
              {initialQuestion || "질문이 없습니다."}
            </div>
          </div>

          {/* Left bottom fixed input */}
          <div className="absolute inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur">
            <form onSubmit={onFollowUpSubmit} className="flex gap-2">
              <Input
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="추가 질문을 입력하세요…"
                className="h-11 rounded-xl border-slate-200 focus-visible:ring-[color:var(--brand)]"
              />
              <Button
                type="submit"
                className="h-11 rounded-xl bg-[color:var(--brand)] text-[color:var(--brand-foreground)] hover:bg-[color:var(--brand)]/90"
              >
                보내기
              </Button>
            </form>
          </div>
        </section>

        {/* Right */}
        <section className="flex h-full flex-col">
          <header className="px-6 pt-6">
            <div className="text-xs font-medium text-slate-500">AI 답변(스트리밍)</div>
          </header>

          <div className="flex-1 overflow-auto px-6 pb-6 pt-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="whitespace-pre-wrap text-sm leading-6 text-slate-800">
                {answer}
                <span className="ml-1 inline-block h-4 w-[2px] translate-y-[2px] animate-pulse bg-slate-400" />
              </div>
            </div>

            {/* CTA at the "end of answer" */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-sm font-semibold text-slate-900">
                충분한 답이 되셨나요?
              </div>
              <div className="mt-1 text-xs text-slate-500">
                생성형 AI는 부정확할 가능성이 있습니다.
              </div>
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                  onClick={openCtaModal}
                >
                  가장 정확한 답변을 받고 싶으시다면?
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Dialog
        open={ctaOpen}
        onOpenChange={(open) => {
          setCtaOpen(open);
          if (!open) resetCtaFlow();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>가장 정확한 답변을 원하시나요?</DialogTitle>
            <DialogDescription>
              용도에 따라 필요한 정보와 절차가 달라집니다. 아래에서 선택해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <AnimatePresence mode="wait">
              {modalStep === "chooseType" && (
                <motion.div
                  key="chooseType"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      className="h-12 rounded-xl bg-[color:var(--brand)] text-[color:var(--brand-foreground)] hover:bg-[color:var(--brand)]/90"
                      onClick={() => pickType("personal")}
                    >
                      개인용
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 rounded-xl border-slate-300 bg-white hover:bg-slate-50"
                      onClick={() => pickType("business")}
                    >
                      기업용
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    선택 후 1.3초 뒤, 가능한 옵션을 안내해드립니다.
                  </p>
                </motion.div>
              )}

              {modalStep === "typePicked" && (
                <motion.div
                  key="typePicked"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-3"
                >
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
                    {consultType === "personal"
                      ? "개인용을 선택하셨습니다"
                      : "기업용을 선택하셨습니다"}
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <motion.div
                      className="h-full bg-[color:var(--brand)]"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.3, ease: "easeInOut" }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">옵션을 불러오는 중…</p>
                </motion.div>
              )}

              {modalStep === "options" && (
                <motion.div
                  key="options"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">
                      {consultType === "personal" ? "개인용 옵션" : "기업용 옵션"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      버튼을 누르면 바로 아래에 입력 폼이 나타납니다.
                    </div>

                    <div className="mt-4 space-y-2">
                      {consultType === "personal" ? (
                        <>
                          <Button
                            type="button"
                            variant={selectedOption === "personal_call" ? "default" : "outline"}
                            className={
                              selectedOption === "personal_call"
                                ? "w-full rounded-xl bg-[color:var(--brand)] text-[color:var(--brand-foreground)] hover:bg-[color:var(--brand)]/90"
                                : "w-full rounded-xl border-slate-300 bg-white hover:bg-slate-50"
                            }
                            onClick={() =>
                              setSelectedOption((prev) =>
                                prev === "personal_call" ? null : "personal_call"
                              )
                            }
                          >
                            전화상담 예약하기(10분당 9,900원)
                          </Button>

                          <Button
                            type="button"
                            variant={selectedOption === "personal_quote" ? "default" : "outline"}
                            className={
                              selectedOption === "personal_quote"
                                ? "w-full rounded-xl bg-[color:var(--brand)] text-[color:var(--brand-foreground)] hover:bg-[color:var(--brand)]/90"
                                : "w-full rounded-xl border-slate-300 bg-white hover:bg-slate-50"
                            }
                            onClick={() =>
                              setSelectedOption((prev) =>
                                prev === "personal_quote" ? null : "personal_quote"
                              )
                            }
                          >
                            무료로 견적서 받아보기
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant={selectedOption === "biz_call" ? "default" : "outline"}
                            className={
                              selectedOption === "biz_call"
                                ? "w-full rounded-xl bg-[color:var(--brand)] text-[color:var(--brand-foreground)] hover:bg-[color:var(--brand)]/90"
                                : "w-full rounded-xl border-slate-300 bg-white hover:bg-slate-50"
                            }
                            onClick={() =>
                              setSelectedOption((prev) =>
                                prev === "biz_call" ? null : "biz_call"
                              )
                            }
                          >
                            전화상담 예약(16,500원)
                          </Button>

                          <Button
                            type="button"
                            variant={selectedOption === "biz_quote" ? "default" : "outline"}
                            className={
                              selectedOption === "biz_quote"
                                ? "w-full rounded-xl bg-[color:var(--brand)] text-[color:var(--brand-foreground)] hover:bg-[color:var(--brand)]/90"
                                : "w-full rounded-xl border-slate-300 bg-white hover:bg-slate-50"
                            }
                            onClick={() =>
                              setSelectedOption((prev) =>
                                prev === "biz_quote" ? null : "biz_quote"
                              )
                            }
                          >
                            무료 견적
                          </Button>

                          <Button
                            type="button"
                            variant={selectedOption === "biz_brochure" ? "default" : "outline"}
                            className={
                              selectedOption === "biz_brochure"
                                ? "w-full rounded-xl bg-[color:var(--brand)] text-[color:var(--brand-foreground)] hover:bg-[color:var(--brand)]/90"
                                : "w-full rounded-xl border-slate-300 bg-white hover:bg-slate-50"
                            }
                            onClick={() =>
                              setSelectedOption((prev) =>
                                prev === "biz_brochure" ? null : "biz_brochure"
                              )
                            }
                          >
                            노무법인 소개서 요청
                          </Button>
                        </>
                      )}
                    </div>

                    <AnimatePresence mode="wait">
                      {selectedOption && (
                        <motion.div
                          key={selectedOption}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-sm font-semibold text-slate-900">
                              신청 정보 입력
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              제출은 아직 더미 동작이며, 실제 전송 API는 다음 단계에서 연결할 수 있습니다.
                            </div>

                            <div className="mt-4 grid gap-3">
                              {renderInlineForm()}
                              <Button
                                type="button"
                                className="rounded-xl bg-[color:var(--brand)] text-[color:var(--brand-foreground)] hover:bg-[color:var(--brand)]/90"
                                disabled={submitState === "submitting"}
                                onClick={submitRequest}
                              >
                                {submitState === "submitting" ? "제출 중…" : "제출"}
                              </Button>
                              {submitMessage ? (
                                <div
                                  className={[
                                    "text-xs",
                                    submitState === "error"
                                      ? "text-red-600"
                                      : "text-slate-600",
                                  ].join(" ")}
                                >
                                  {submitMessage}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-slate-300 bg-white hover:bg-slate-50"
                      onClick={resetCtaFlow}
                    >
                      처음으로
                    </Button>
                    <Button
                      type="button"
                      className="ml-auto rounded-xl bg-[color:var(--brand)] text-[color:var(--brand-foreground)] hover:bg-[color:var(--brand)]/90"
                      onClick={() => setCtaOpen(false)}
                    >
                      닫기
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

