package com.cortinave.controlebobinas;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // FORÇAR LIMPEZA DE CACHE - Debug WebView cache teimoso
        if (getBridge() != null && getBridge().getWebView() != null) {
            // Limpar cache e histórico
            getBridge().getWebView().clearCache(true);
            getBridge().getWebView().clearHistory();
            CookieManager.getInstance().removeAllCookies(null);
            CookieManager.getInstance().flush();
            
            // DESABILITAR CACHE COMPLETAMENTE
            WebSettings settings = getBridge().getWebView().getSettings();
            settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
            
            android.util.Log.d("MainActivity", "🔥 Cache WebView DESABILITADO! v2.2.2-20251210-0935");
        }
    }
}
