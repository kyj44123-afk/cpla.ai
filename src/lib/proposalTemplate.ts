export const PROPOSAL_TEMPLATE = `
<div style="font-family: 'Malgun Gothic', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; background: white; font-size: 12px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1a4f75; padding-bottom: 10px;">
        <h1 style="color: #1a4f75; margin: 0; font-size: 20px;">법률 자문 및 사건 위임 제안서</h1>
        <p style="color: #666; margin-top: 5px; font-size: 11px;">Document No. {{DATE_NODASH}}-001</p>
    </div>

    <!-- Info -->
    <div style="margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <tr>
                <td style="width: 80px; font-weight: bold; padding: 6px; background: #f8f9fa; border: 1px solid #ddd;">수 신</td>
                <td style="padding: 6px; border: 1px solid #ddd;">{{NAME}} 귀하 ({{CONTACT}})</td>
            </tr>
            <tr>
                <td style="font-weight: bold; padding: 6px; background: #f8f9fa; border: 1px solid #ddd;">일 자</td>
                <td style="padding: 6px; border: 1px solid #ddd;">{{DATE}}</td>
            </tr>
            <tr>
                <td style="font-weight: bold; padding: 6px; background: #f8f9fa; border: 1px solid #ddd;">제 목</td>
                <td style="padding: 6px; border: 1px solid #ddd;">{{SERVICE_TYPE}} 관련 위임 제안의 건</td>
            </tr>
        </table>
    </div>

    <!-- Content -->
    <div style="line-height: 1.6; color: #333; margin-bottom: 20px; font-size: 11px;">
        <p style="margin: 8px 0;">귀하의 무궁한 발전을 기원합니다.</p>
        <p style="margin: 8px 0;">본 제안서는 귀하께서 문의하신 <strong>{{SERVICE_TYPE}}</strong> 건에 대하여, 전문적인 법률 서비스를 제안드리기 위해 작성되었습니다.</p>
        <p style="margin: 8px 0;">다년간의 노동 사건 경험을 바탕으로 귀하의 권리 구제를 위해 최선을 다할 것을 약속드립니다.</p>
    </div>

    <!-- Fee Structure -->
    <div style="margin-bottom: 20px;">
        <h3 style="color: #1a4f75; border-left: 4px solid #1a4f75; padding-left: 8px; margin-bottom: 10px; font-size: 13px;">수임료 안내</h3>
        <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 11px;">
            <thead>
                <tr style="background: #f1f3f5;">
                    <th style="padding: 8px; border: 1px solid #ddd;">구분</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">금액 (VAT 별도)</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">비고</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">착수금</td>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">{{FEE_RETAINER}} 원</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">계약 체결 시 지급</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">중도금</td>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">{{FEE_PROGRESS}} 원</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">사건 진행 중 협의</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">성공보수</td>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">{{FEE_SUCCESS}} 원</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">사건 종결 시 지급</td>
                </tr>
            </tbody>
            <tfoot>
                <tr style="background: #fff9db;">
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">합계</td>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #E97132;">{{FEE_TOTAL}} 원</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">-</td>
                </tr>
            </tfoot>
        </table>
    </div>

    <!-- Footer -->
    <div style="margin-top: 20px; text-align: center;">
        <p style="font-size: 10px; color: #888; margin-bottom: 15px;">
            본 견적의 유효기간은 발행일로부터 14일입니다.
        </p>
        <div style="display: inline-block; padding: 15px 30px; border: 2px solid #1a4f75; border-radius: 8px;">
            <p style="margin: 0; font-size: 13px; color: #1a4f75; font-weight: bold;">공인노무사 곽영준</p>
            <p style="margin: 5px 0 0; font-size: 11px; color: #666;">(직인 생략)</p>
        </div>
    </div>
</div>
`;
