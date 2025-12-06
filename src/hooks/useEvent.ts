import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

// Frontend analytics event structure
export interface FrontendAnalyticsEvent {
  event: string;
  user_id?: string;
  deal_id?: string;
  case_id?: string;
  ts: number;
  extras?: Record<string, any>;
}

// Common event types for type safety
export type EventType =
  // Home page events
  | 'view_home'
  | 'cta_get_started'

  // Wallet connection events
  | 'connect_wallet_click'
  | 'wallet_connected'
  | 'wallet_verification_attempt'
  | 'wallet_verification_rejected'
  | 'wallet_signature_success'
  | 'wallet_connection_complete'
  | 'wallet_connection_failed'
  | 'network_switch'

  // Deal list events
  | 'view_deal_list'
  | 'filter_change'
  | 'row_open'
  | 'deal_delete_click'

  // Deal overview events
  | 'view_deal'
  | 'deal_refresh'
  | 'deals_refresh'
  | 'explorer_link_click'
  | 'action_click_fund'
  | 'action_click_confirm'
  | 'action_click_dispute'
  | 'action_click_resolve'

  // Escrow flow events
  | 'deal_draft_started'
  | 'deal_draft_submitted'
  | 'view_funding'
  | 'fund_attempt'
  | 'fund_success'
  | 'fund_failed'
  | 'fund_back_button_click'

  // Resolution events
  | 'view_resolution'
  | 'execute_release_click'
  | 'execute_refund_click'
  | 'execute_ai_decision'
  | 'payout_success'
  | 'resolution_back_button_click'

  // Dispute events
  | 'dispute_started'
  | 'evidence_attach_open'
  | 'dispute_submitted'

  // Evidence events
  | 'evidence_submission_started'
  | 'evidence_file_uploaded'
  | 'evidence_submitted'
  | 'evidence_upload_started'
  | 'evidence_upload_done'
  | 'evidence_delete'

  // Profile events
  | 'profile_update'

  // Notification events
  | 'notification_read'
  | 'notification_click'

  // Documentation events
  | 'view_docs'

  // Wallet management events
  | 'wallet_refresh'
  | 'wallet_disconnected';

/**
 * Hook for tracking frontend analytics events
 * Provides fire-and-forget event tracking to actions-server /api/events endpoint
 */
export function useEvent() {
  const { publicKey } = useWallet();

  const trackEvent = useCallback(
    async (
      event: EventType,
      extras?: Record<string, any>,
      dealId?: string,
      caseId?: string
    ) => {
      try {
        const eventPayload: FrontendAnalyticsEvent = {
          event,
          user_id: publicKey?.toString(),
          deal_id: dealId,
          case_id: caseId,
          ts: Date.now(),
          extras,
        };

        // Fire-and-forget to analytics endpoint
        const ACTIONS_BASE_URL = import.meta.env.VITE_ACTIONS_SERVER_URL || 'http://localhost:4000';
        fetch(`${ACTIONS_BASE_URL}/api/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
        }).then(response => {
          if (!response.ok && process.env.NODE_ENV === 'development') {
            console.warn(`Analytics endpoint returned ${response.status}: Events may not be stored`);
          }
        }).catch((error) => {
          // Silent fail for analytics - don't break user experience
          if (process.env.NODE_ENV === 'development') {
            console.warn('Analytics event failed (server may not be running):', error.message);
          }
        });

        // Optional: Also log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Event tracked:', {
            event,
            user_id: publicKey?.toString() || 'anonymous',
            deal_id: dealId,
            case_id: caseId,
            extras,
          });
        }
      } catch (error) {
        // Silent fail for analytics - don't break user experience
        if (process.env.NODE_ENV === 'development') {
          console.warn('Analytics event error:', error);
        }
      }
    },
    [publicKey]
  );

  // Convenience methods for common event patterns
  const trackPageView = useCallback(
    (page: string, extras?: Record<string, any>) => {
      trackEvent(`view_${page}` as EventType, extras);
    },
    [trackEvent]
  );

  const trackAction = useCallback(
    (action: string, dealId?: string, extras?: Record<string, any>) => {
      trackEvent(`action_click_${action}` as EventType, extras, dealId);
    },
    [trackEvent]
  );

  const trackDealEvent = useCallback(
    (event: EventType, dealId: string, extras?: Record<string, any>) => {
      trackEvent(event, extras, dealId);
    },
    [trackEvent]
  );

  const trackDisputeEvent = useCallback(
    (event: EventType, dealId: string, caseId?: string, extras?: Record<string, any>) => {
      trackEvent(event, extras, dealId, caseId);
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackPageView,
    trackAction,
    trackDealEvent,
    trackDisputeEvent,
  };
}

export default useEvent;